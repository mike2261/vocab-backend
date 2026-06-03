import { type } from "arktype";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppContext } from "../fetch";
import { middlewareJWT, signAccessToken } from "../hxxp/auth";
import { AppError } from "../hxxp/error";
import { validate } from "../hxxp/validator";
import * as authService from "../services/auth";
import { signRefreshToken, verifyRefreshToken } from "../utils/crypto";

const REFRESH_EXPIRES = 7 * 24 * 60 * 60;

const schemaRegister = type({ email: "string.email", password: "string >= 8", "displayName?": "string | null" });
const schemaLogin = type({ email: "string.email", password: "string" });

const auth = new Hono<AppContext>();

auth.post("/register", validate("json", schemaRegister), async (c) => {
  const body = c.req.valid("json");
  const db = c.get("db");
  const user = await authService.registerUser(db, {
    email: body.email,
    password: body.password,
    displayName: body.displayName,
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id, c.env.JWT_SECRET),
    signRefreshToken(user.id, c.env.JWT_REFRESH_SECRET, REFRESH_EXPIRES),
  ]);

  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: REFRESH_EXPIRES,
  });
  return c.json({ data: user, accessToken }, 201);
});

auth.post("/login", validate("json", schemaLogin), async (c) => {
  const body = c.req.valid("json");
  const db = c.get("db");
  const user = await authService.loginUser(db, body);
  if (!user) throw new AppError("Authn", "Invalid email or password");

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id, c.env.JWT_SECRET),
    signRefreshToken(user.id, c.env.JWT_REFRESH_SECRET, REFRESH_EXPIRES),
  ]);

  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: REFRESH_EXPIRES,
  });
  return c.json({ data: { accessToken, user } });
});

auth.post("/logout", (c) => {
  deleteCookie(c, "refreshToken", { path: "/" });
  return c.json({ data: { ok: true } });
});

auth.post("/refresh", async (c) => {
  const token = getCookie(c, "refreshToken");
  if (!token) throw new AppError("Authn", "Refresh token missing");

  let payload: { sub: string };
  try {
    payload = await verifyRefreshToken(token, c.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Authn", "Invalid or expired refresh token");
  }

  const accessToken = await signAccessToken(payload.sub, c.env.JWT_SECRET);
  return c.json({ data: { accessToken } });
});

auth.get("/me", middlewareJWT, async (c) => {
  const jwtPayload = c.get("jwtPayload");
  const userId = String(jwtPayload.sub);
  const db = c.get("db");
  const user = await authService.getUserById(db, userId);
  if (!user) throw new AppError("Authn", "User not found");
  return c.json({ data: user });
});

auth.get("/google", (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CALLBACK_URL) {
    throw new AppError("NotExist", "Google OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return c.json({ data: { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` } });
});

auth.get("/google/callback", async (c) => {
  if (
    !c.env.GOOGLE_CLIENT_ID ||
    !c.env.GOOGLE_CLIENT_SECRET ||
    !c.env.GOOGLE_CALLBACK_URL ||
    !c.env.GOOGLE_REDIRECT_FE_URL
  ) {
    throw new AppError("NotExist", "Google OAuth is not configured");
  }

  const code = c.req.query("code");
  if (!code) throw new AppError("Invalid", "Authorization code missing");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) throw new AppError("Authn", "Failed to exchange authorization code");

  const tokens = (await tokenRes.json()) as { access_token: string };

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userInfoRes.ok) throw new AppError("Authn", "Failed to fetch Google user info");

  const googleUser = (await userInfoRes.json()) as { id: string; email: string; name?: string; picture?: string };
  const db = c.get("db");

  const user = await authService.findOrCreateGoogleUser(db, {
    googleId: googleUser.id,
    email: googleUser.email,
    displayName: googleUser.name ?? null,
    avatarUrl: googleUser.picture ?? null,
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id, c.env.JWT_SECRET),
    signRefreshToken(user.id, c.env.JWT_REFRESH_SECRET, REFRESH_EXPIRES),
  ]);

  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: REFRESH_EXPIRES,
  });
  return c.redirect(`${c.env.GOOGLE_REDIRECT_FE_URL}?token=${accessToken}`);
});

export default auth;
