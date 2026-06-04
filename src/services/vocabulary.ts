import type { Kysely } from "kysely";
import type { DB } from "../datastore/d1/index";
import { generateWordData } from "../llm/word";
import { normalizeUtcTimestamp } from "../utils/datetime";
import { newUUID } from "../utils/uuid";

async function getVocabWithDetails(db: Kysely<DB>, vocabId: string) {
  const vocab = await db.selectFrom("vocabularies").where("id", "=", vocabId).selectAll().executeTakeFirst();
  if (!vocab) return null;

  const [meanings, reviewState] = await Promise.all([
    db.selectFrom("meanings").where("vocabulary_id", "=", vocabId).orderBy("order_index", "asc").selectAll().execute(),
    db.selectFrom("review_states").where("vocabulary_id", "=", vocabId).selectAll().executeTakeFirst(),
  ]);

  const meaningIds = meanings.map((m) => m.id);
  const examples =
    meaningIds.length > 0
      ? await db
          .selectFrom("examples")
          .where("meaning_id", "in", meaningIds)
          .orderBy("order_index", "asc")
          .selectAll()
          .execute()
      : [];

  return {
    id: vocab.id,
    word: vocab.word,
    pronunciationUk: vocab.pronunciation_uk,
    pronunciationUs: vocab.pronunciation_us,
    createdAt: normalizeUtcTimestamp(vocab.created_at),
    updatedAt: normalizeUtcTimestamp(vocab.updated_at),
    meanings: meanings.map((m) => ({
      id: m.id,
      partOfSpeech: m.part_of_speech,
      definition: m.definition,
      translation: m.translation,
      cefrLevel: m.cefr_level,
      orderIndex: m.order_index,
      examples: examples
        .filter((e) => e.meaning_id === m.id)
        .map((e) => ({ id: e.id, sentence: e.sentence, translation: e.translation })),
    })),
    reviewState: reviewState
      ? {
          stage: reviewState.stage,
          lastReviewedAt: normalizeUtcTimestamp(reviewState.last_reviewed_at),
          nextReviewAt: normalizeUtcTimestamp(reviewState.next_review_at),
        }
      : null,
  };
}

export async function createVocabulary(db: Kysely<DB>, userId: string, word: string, apiKey: string) {
  let llmData:
    | Awaited<ReturnType<typeof generateWordData>>
    | { pronunciationUk: null; pronunciationUs: null; meanings: [] };
  let llmError = false;

  try {
    llmData = await generateWordData(word, apiKey);
  } catch {
    llmError = true;
    llmData = { pronunciationUk: null, pronunciationUs: null, meanings: [] };
  }

  const vocabId = newUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("vocabularies")
    .values({
      id: vocabId,
      user_id: userId,
      word,
      source: "manual",
      pronunciation_uk: llmData.pronunciationUk ?? null,
      pronunciation_us: llmData.pronunciationUs ?? null,
      created_at: now,
      updated_at: now,
    })
    .execute();

  for (const [i, m] of llmData.meanings.entries()) {
    const meaningId = newUUID();
    await db
      .insertInto("meanings")
      .values({
        id: meaningId,
        vocabulary_id: vocabId,
        part_of_speech: m.partOfSpeech,
        definition: m.definition,
        translation: m.translation ?? null,
        cefr_level: m.cefrLevel ?? null,
        order_index: i,
        created_at: now,
        updated_at: now,
      })
      .execute();

    for (const [j, e] of m.examples.entries()) {
      await db
        .insertInto("examples")
        .values({
          id: newUUID(),
          meaning_id: meaningId,
          sentence: e.sentence,
          translation: e.translation ?? null,
          order_index: j,
          created_at: now,
          updated_at: now,
        })
        .execute();
    }
  }

  await db
    .insertInto("review_states")
    .values({
      vocabulary_id: vocabId,
      stage: 1,
      interval_days: 0,
      repetition_count: 0,
      ease_factor: 2.5,
      next_review_at: now,
      created_at: now,
      updated_at: now,
    })
    .execute();

  const vocabulary = await getVocabWithDetails(db, vocabId);
  return { vocabulary, llmError };
}

export async function listVocabularies(
  db: Kysely<DB>,
  userId: string,
  query: { page?: number; pageSize?: number; search?: string; tag?: string; stage?: number },
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  let baseQuery = db.selectFrom("vocabularies").where("user_id", "=", userId);

  if (query.search) {
    baseQuery = baseQuery.where("word", "like", `%${query.search}%`);
  }

  if (query.tag) {
    const taggedIds = await db
      .selectFrom("vocabulary_tags")
      .where("tag", "=", query.tag)
      .select("vocabulary_id")
      .execute();
    const ids = taggedIds.map((r) => r.vocabulary_id);
    if (ids.length === 0) return { items: [], total: 0, page, pageSize };
    baseQuery = baseQuery.where("id", "in", ids);
  }

  if (query.stage !== undefined) {
    const stageIds = await db
      .selectFrom("review_states")
      .where("stage", "=", query.stage)
      .select("vocabulary_id")
      .execute();
    const ids = stageIds.map((r) => r.vocabulary_id);
    if (ids.length === 0) return { items: [], total: 0, page, pageSize };
    baseQuery = baseQuery.where("id", "in", ids);
  }

  const [items, countRow] = await Promise.all([
    baseQuery.orderBy("created_at", "desc").limit(pageSize).offset(skip).selectAll().execute(),
    baseQuery.select(db.fn.countAll<number>().as("count")).executeTakeFirst(),
  ]);

  const total = Number(countRow?.count ?? 0);

  const vocabIds = items.map((v) => v.id);
  if (vocabIds.length === 0) return { items: [], total, page, pageSize };

  const [allMeanings, allReviewStates] = await Promise.all([
    db
      .selectFrom("meanings")
      .where("vocabulary_id", "in", vocabIds)
      .orderBy("order_index", "asc")
      .selectAll()
      .execute(),
    db
      .selectFrom("review_states")
      .where("vocabulary_id", "in", vocabIds)
      .select(["vocabulary_id", "stage", "next_review_at"])
      .execute(),
  ]);

  const enriched = items.map((v) => {
    const rs = allReviewStates.find((r) => r.vocabulary_id === v.id);
    return {
      id: v.id,
      word: v.word,
      createdAt: normalizeUtcTimestamp(v.created_at),
      reviewState: rs ? { stage: rs.stage, nextReviewAt: normalizeUtcTimestamp(rs.next_review_at) } : null,
      meanings: allMeanings
        .filter((m) => m.vocabulary_id === v.id)
        .map((m) => ({
          id: m.id,
          partOfSpeech: m.part_of_speech,
          definition: m.definition,
          translation: m.translation,
          cefrLevel: m.cefr_level,
        })),
    };
  });

  return { items: enriched, total, page, pageSize };
}

export async function getDueVocabularies(db: Kysely<DB>, userId: string, limit: number) {
  const now = new Date().toISOString();
  const dueStates = await db
    .selectFrom("review_states")
    .innerJoin("vocabularies", "vocabularies.id", "review_states.vocabulary_id")
    .where("vocabularies.user_id", "=", userId)
    .where("review_states.next_review_at", "<=", now)
    .orderBy("review_states.next_review_at", "asc")
    .limit(limit)
    .select("review_states.vocabulary_id")
    .execute();

  if (dueStates.length === 0) return [];

  const vocabIds = dueStates.map((r) => r.vocabulary_id);
  const results = await Promise.all(vocabIds.map((id) => getVocabWithDetails(db, id)));
  return results.filter((v): v is NonNullable<typeof v> => v !== null);
}

export async function getVocabularyById(db: Kysely<DB>, userId: string, id: string) {
  const vocab = await db
    .selectFrom("vocabularies")
    .where("id", "=", id)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  if (!vocab) return null;
  return getVocabWithDetails(db, id);
}

export async function updateVocabulary(
  db: Kysely<DB>,
  userId: string,
  id: string,
  data: {
    word?: string;
    pronunciation_uk?: string | null;
    pronunciation_us?: string | null;
    note?: string | null;
    source?: string;
    tags?: string[];
  },
) {
  const existing = await db
    .selectFrom("vocabularies")
    .where("id", "=", id)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  if (!existing) return null;

  const { tags, ...fields } = data;
  const now = new Date().toISOString();

  if (Object.keys(fields).length > 0) {
    await db
      .updateTable("vocabularies")
      .set({ ...fields, updated_at: now })
      .where("id", "=", id)
      .execute();
  }

  if (tags !== undefined) {
    await db.deleteFrom("vocabulary_tags").where("vocabulary_id", "=", id).execute();
    for (const tag of tags) {
      await db
        .insertInto("vocabulary_tags")
        .values({ id: newUUID(), vocabulary_id: id, tag, created_at: now })
        .execute();
    }
  }

  return getVocabWithDetails(db, id);
}

export async function deleteVocabulary(db: Kysely<DB>, userId: string, id: string) {
  const existing = await db
    .selectFrom("vocabularies")
    .where("id", "=", id)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  if (!existing) return false;
  await db.deleteFrom("vocabularies").where("id", "=", id).execute();
  return true;
}
