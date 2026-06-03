import { type } from "arktype";
import { Hono } from "hono";
import { verifyWithJwks } from "hono/jwt";
import type { AppContext } from "../fetch";
import { issueToken, middlewareJWT } from "../hxxp/auth";
import { AppError } from "../hxxp/error";
import { validate } from "../hxxp/validator";
import * as authService from "../services/auth";

const schemaEmailRequest = type({ email: "string.email" });
const schemaEmailVerify = type({ email: "string.email", code: /^[0-9]{6}$/ });
const schemaGoogle = type({ id_token: "string > 0" });

const schemaIDTokenGoogle = type({
  aud: "string",
  sub: "string",
  email: "string",
  email_verified: "boolean",
  name: "string",
  picture: "string | undefined",
});

const auth = new Hono<AppContext>();

auth.post("/email/request", validate("json", schemaEmailRequest), async (c) => {
  const { email } = c.req.valid("json");
  const db = c.get("db");

  const code = await authService.createOTP(db, email.toLowerCase());

  if (c.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Lexio <noreply@${new URL(c.env.APP_URL).hostname}>`,
        to: [email],
        subject: "Your Lexio login code",
        html: `<p>Your login code is: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>Expires in 10 minutes. Do not share this code.</p>`,
      }),
    });
  } else {
    console.info(`[auth] OTP for ${email}: ${code}`);
  }

  return c.json({ data: { email: email.toLowerCase() } });
});

auth.post("/email/verify", validate("json", schemaEmailVerify), async (c) => {
  const { email, code } = c.req.valid("json");
  const db = c.get("db");

  await authService.verifyOTP(db, email.toLowerCase(), code);
  const user = await authService.upsertUserByEmail(db, email.toLowerCase());
  const token = await issueToken(user.id, c.env.JWT_SECRET);

  return c.json({ data: { token, user: { id: user.id, email: user.email, display_name: user.display_name } } });
});

auth.post("/google", validate("json", schemaGoogle), async (c) => {
  if (!c.env.GSI_CLIENT_ID) throw new AppError("NotExist", "Google Sign-In is not configured");

  const { id_token } = c.req.valid("json");

  let rawPayload: unknown;
  try {
    rawPayload = await verifyWithJwks(
      id_token,
      {
        jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
        verification: { iss: "https://accounts.google.com", aud: c.env.GSI_CLIENT_ID, iat: true, exp: true },
        allowedAlgorithms: ["RS256"],
      },
      { cf: { cacheTtlByStatus: { "200-299": 86400 } } },
    );
  } catch {
    throw new AppError("Authn", "Invalid Google token");
  }

  const idToken = schemaIDTokenGoogle(rawPayload);
  if (idToken instanceof type.errors) throw new AppError("Authn", "Invalid Google token payload");
  if (!idToken.email_verified) throw new AppError("Authn", "Google email not verified");
  if (idToken.aud !== c.env.GSI_CLIENT_ID) throw new AppError("Authn", "Token audience mismatch");

  const db = c.get("db");
  const user = await authService.upsertUserByGoogle(db, {
    googleId: `${idToken.aud}:${idToken.sub}`,
    email: idToken.email,
    name: idToken.name,
    avatarUrl: idToken.picture ?? null,
  });

  const token = await issueToken(user.id, c.env.JWT_SECRET);
  return c.json({ data: { token, user: { id: user.id, email: user.email, display_name: user.display_name } } });
});

auth.get("/me", middlewareJWT, async (c) => {
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const user = await authService.getUserById(db, userId);
  if (!user) throw new AppError("Authn", "User not found");
  return c.json({ data: user });
});

export default auth;
