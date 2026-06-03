import { createMiddleware } from "hono/factory";
import type { JwtVariables } from "hono/jwt";
import { jwt, sign } from "hono/jwt";
import type { AppContext } from "../fetch";

export type JWTPayload = {
  sub: string;
  iat: number;
  exp: number;
};

export type AuthVariables = JwtVariables<JWTPayload>;

export const middlewareJWT = createMiddleware<AppContext>(async (c, next) => {
  return await jwt({ secret: c.env.JWT_SECRET, alg: "HS256" })(c, next);
});

export async function signAccessToken(userId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await sign({ sub: userId, iat: now, exp: now + 15 * 60 }, secret, "HS256");
}
