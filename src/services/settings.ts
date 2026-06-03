import type { Kysely } from "kysely";
import type { DB } from "../datastore/d1/index";

const DEFAULT_THRESHOLDS = { "1": 0, "2": 1, "3": 4, "4": 15, "5": 60 };

export async function getOrCreateSettings(db: Kysely<DB>, userId: string) {
  const existing = await db.selectFrom("user_settings").where("user_id", "=", userId).selectAll().executeTakeFirst();
  if (existing) {
    return { ...existing, stage_thresholds: JSON.parse(existing.stage_thresholds) as Record<string, number> };
  }

  const now = new Date().toISOString();
  await db
    .insertInto("user_settings")
    .values({ user_id: userId, stage_thresholds: JSON.stringify(DEFAULT_THRESHOLDS), created_at: now, updated_at: now })
    .execute();

  return { user_id: userId, stage_thresholds: DEFAULT_THRESHOLDS };
}

export async function updateSettings(
  db: Kysely<DB>,
  userId: string,
  data: { stageThresholds?: Record<string, number> },
) {
  const now = new Date().toISOString();
  const existing = await db
    .selectFrom("user_settings")
    .where("user_id", "=", userId)
    .select("user_id")
    .executeTakeFirst();

  if (existing) {
    const current = await db
      .selectFrom("user_settings")
      .where("user_id", "=", userId)
      .select("stage_thresholds")
      .executeTakeFirstOrThrow();
    const merged =
      data.stageThresholds !== undefined
        ? data.stageThresholds
        : (JSON.parse(current.stage_thresholds) as Record<string, number>);

    await db
      .updateTable("user_settings")
      .set({ stage_thresholds: JSON.stringify(merged), updated_at: now })
      .where("user_id", "=", userId)
      .execute();

    return { user_id: userId, stage_thresholds: merged };
  }

  const thresholds = data.stageThresholds ?? DEFAULT_THRESHOLDS;
  await db
    .insertInto("user_settings")
    .values({ user_id: userId, stage_thresholds: JSON.stringify(thresholds), created_at: now, updated_at: now })
    .execute();

  return { user_id: userId, stage_thresholds: thresholds };
}
