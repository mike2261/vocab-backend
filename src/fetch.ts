import { type ErrorHandler, Hono } from "hono";
import { cors } from "hono/cors";
import type { JwtVariables } from "hono/jwt";
import type { Kysely } from "kysely";
import type { DB } from "./datastore/d1/index";
import { initDB_D1 } from "./datastore/index";
import auth from "./handlers/auth";
import passages from "./handlers/passages";
import reviews from "./handlers/reviews";
import settings from "./handlers/settings";
import vocabularies from "./handlers/vocabularies";
import { AppError, appErrorToBody, wrapError } from "./hxxp/error";

export type AppContext = {
  Bindings: Env;
  Variables: JwtVariables & { db: Kysely<DB> };
};

const app = new Hono<AppContext>();

const appOnError: ErrorHandler<AppContext> = (err, c) => {
  const appErr = err instanceof AppError ? err : wrapError(err);
  c.status(appErr.httpCode as Parameters<typeof c.status>[0]);
  if (appErr.code === "Database" || appErr.code === "Service" || appErr.code === "Other") {
    console.error("api:error", err);
  }
  return c.json(appErrorToBody(appErr));
};

app.onError(appOnError);

app.use("*", (c, next) => {
  const allowedOrigins = [
    ...c.env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    "https://vocab-web.anhduc22601.workers.dev",
    "http://localhost:3000",
  ];
  return cors({
    origin: ["https://vocab-web.anhduc22601.workers.dev",
    "http://localhost:3000"],
    credentials: true,
    maxAge: 3600,
  })(c, next);
});

app.use("*", async (c, next) => {
  c.set("db", initDB_D1(c.env));
  await next();
});

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

const api = new Hono<AppContext>();
api.route("/auth", auth);
api.route("/vocabularies", vocabularies);
api.route("/reviews", reviews);
api.route("/passages", passages);
api.route("/settings", settings);

app.route("/api", api);

export { app };
