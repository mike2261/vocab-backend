import type { Kysely } from "kysely";
import type { DB } from "../datastore/d1/index";
import { normalizeUtcTimestamp } from "../utils/datetime";
import { newUUID } from "../utils/uuid";
import { calculateNextReview, type ReviewRating } from "./repetition";

export async function reviewVocabulary(db: Kysely<DB>, userId: string, vocabularyId: string, rating: ReviewRating) {
  const vocab = await db
    .selectFrom("vocabularies")
    .where("id", "=", vocabularyId)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  if (!vocab) return null;

  const state = await db
    .selectFrom("review_states")
    .where("vocabulary_id", "=", vocabularyId)
    .selectAll()
    .executeTakeFirst();
  if (!state) return null;

  const next = calculateNextReview(
    {
      stage: state.stage,
      repetitionCount: state.repetition_count,
      intervalDays: state.interval_days,
      easeFactor: state.ease_factor,
    },
    rating,
  );

  const now = new Date().toISOString();

  await db
    .updateTable("review_states")
    .set({
      stage: next.stage,
      repetition_count: next.repetitionCount,
      interval_days: next.intervalDays,
      ease_factor: next.easeFactor,
      last_reviewed_at: now,
      next_review_at: next.nextReviewAt,
      updated_at: now,
    })
    .where("vocabulary_id", "=", vocabularyId)
    .execute();

  await db
    .insertInto("review_logs")
    .values({
      id: newUUID(),
      vocabulary_id: vocabularyId,
      rating,
      previous_stage: state.stage,
      next_stage: next.stage,
      previous_interval_days: state.interval_days,
      next_interval_days: next.intervalDays,
      reviewed_at: now,
    })
    .execute();

  const updatedState = await db
    .selectFrom("review_states")
    .where("vocabulary_id", "=", vocabularyId)
    .selectAll()
    .executeTakeFirst();

  if (!updatedState) return null;

  return {
    ...updatedState,
    last_reviewed_at: normalizeUtcTimestamp(updatedState.last_reviewed_at),
    next_review_at: normalizeUtcTimestamp(updatedState.next_review_at) ?? updatedState.next_review_at,
    created_at: normalizeUtcTimestamp(updatedState.created_at) ?? updatedState.created_at,
    updated_at: normalizeUtcTimestamp(updatedState.updated_at) ?? updatedState.updated_at,
  };
}

export async function getReviewHistory(
  db: Kysely<DB>,
  userId: string,
  query: { vocabularyId?: string; page?: number; pageSize?: number },
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const userVocabIds = await db.selectFrom("vocabularies").where("user_id", "=", userId).select("id").execute();
  const ids = userVocabIds.map((v) => v.id);
  if (ids.length === 0) return { items: [], total: 0, page, pageSize };

  let logsQuery = db.selectFrom("review_logs").where("vocabulary_id", "in", ids);
  if (query.vocabularyId) {
    logsQuery = logsQuery.where("vocabulary_id", "=", query.vocabularyId);
  }

  const [items, countRow] = await Promise.all([
    logsQuery.orderBy("reviewed_at", "desc").limit(pageSize).offset(skip).selectAll().execute(),
    logsQuery.select(db.fn.countAll<number>().as("count")).executeTakeFirst(),
  ]);

  const total = Number(countRow?.count ?? 0);
  return {
    items: items.map((r) => ({
      id: r.id,
      rating: r.rating,
      reviewedAt: normalizeUtcTimestamp(r.reviewed_at) ?? r.reviewed_at,
    })),
    total,
    page,
    pageSize,
  };
}
