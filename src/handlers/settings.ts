import { type } from "arktype";
import { Hono } from "hono";
import type { AppContext } from "../fetch";
import { middlewareJWT } from "../hxxp/auth";
import { validate } from "../hxxp/validator";
import * as settingsService from "../services/settings";

const schemaUpdateSettings = type({ "stageThresholds?": "Record<string, number>" });

const settings = new Hono<AppContext>();

settings.use("*", middlewareJWT);

settings.get("/", async (c) => {
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const result = await settingsService.getOrCreateSettings(db, userId);
  return c.json({ data: { stageThresholds: result.stage_thresholds } });
});

settings.patch("/", validate("json", schemaUpdateSettings), async (c) => {
  const userId = String(c.get("jwtPayload").sub);
  const body = c.req.valid("json");
  const db = c.get("db");
  const result = await settingsService.updateSettings(db, userId, { stageThresholds: body.stageThresholds });
  return c.json({ data: { stageThresholds: result.stage_thresholds } });
});

export default settings;
