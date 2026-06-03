import type { Kysely } from "kysely";
import type { DB } from "../datastore/d1/index";
import { newUUID } from "../utils/uuid";

async function assertOwner(db: Kysely<DB>, userId: string, vocabularyId: string): Promise<boolean> {
  const vocab = await db
    .selectFrom("vocabularies")
    .where("id", "=", vocabularyId)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  return vocab !== null;
}

export async function createMeaning(
  db: Kysely<DB>,
  userId: string,
  vocabularyId: string,
  data: {
    partOfSpeech: string;
    definition: string;
    translation?: string | null;
    cefrLevel?: string | null;
    orderIndex?: number;
    examples?: { sentence: string; translation?: string | null; orderIndex?: number }[];
  },
) {
  if (!(await assertOwner(db, userId, vocabularyId))) return null;

  const meaningId = newUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("meanings")
    .values({
      id: meaningId,
      vocabulary_id: vocabularyId,
      part_of_speech: data.partOfSpeech,
      definition: data.definition,
      translation: data.translation ?? null,
      cefr_level: data.cefrLevel ?? null,
      order_index: data.orderIndex ?? 0,
      created_at: now,
      updated_at: now,
    })
    .execute();

  for (const [i, e] of (data.examples ?? []).entries()) {
    await db
      .insertInto("examples")
      .values({
        id: newUUID(),
        meaning_id: meaningId,
        sentence: e.sentence,
        translation: e.translation ?? null,
        order_index: e.orderIndex ?? i,
        created_at: now,
        updated_at: now,
      })
      .execute();
  }

  const meaning = await db.selectFrom("meanings").where("id", "=", meaningId).selectAll().executeTakeFirstOrThrow();
  const examples = await db
    .selectFrom("examples")
    .where("meaning_id", "=", meaningId)
    .orderBy("order_index", "asc")
    .selectAll()
    .execute();
  return { ...meaning, examples };
}

export async function updateMeaning(
  db: Kysely<DB>,
  userId: string,
  vocabularyId: string,
  meaningId: string,
  data: {
    partOfSpeech?: string;
    definition?: string;
    translation?: string | null;
    cefrLevel?: string | null;
    orderIndex?: number;
  },
) {
  if (!(await assertOwner(db, userId, vocabularyId))) return null;

  const meaning = await db
    .selectFrom("meanings")
    .where("id", "=", meaningId)
    .where("vocabulary_id", "=", vocabularyId)
    .select("id")
    .executeTakeFirst();
  if (!meaning) return null;

  const now = new Date().toISOString();
  await db
    .updateTable("meanings")
    .set({
      ...(data.partOfSpeech !== undefined && { part_of_speech: data.partOfSpeech }),
      ...(data.definition !== undefined && { definition: data.definition }),
      ...(data.translation !== undefined && { translation: data.translation }),
      ...(data.cefrLevel !== undefined && { cefr_level: data.cefrLevel }),
      ...(data.orderIndex !== undefined && { order_index: data.orderIndex }),
      updated_at: now,
    })
    .where("id", "=", meaningId)
    .execute();

  return db.selectFrom("meanings").where("id", "=", meaningId).selectAll().executeTakeFirst();
}

export async function deleteMeaning(db: Kysely<DB>, userId: string, vocabularyId: string, meaningId: string) {
  if (!(await assertOwner(db, userId, vocabularyId))) return false;
  const meaning = await db
    .selectFrom("meanings")
    .where("id", "=", meaningId)
    .where("vocabulary_id", "=", vocabularyId)
    .select("id")
    .executeTakeFirst();
  if (!meaning) return false;
  await db.deleteFrom("meanings").where("id", "=", meaningId).execute();
  return true;
}

export async function createExample(
  db: Kysely<DB>,
  userId: string,
  vocabularyId: string,
  meaningId: string,
  data: { sentence: string; translation?: string | null; orderIndex?: number },
) {
  if (!(await assertOwner(db, userId, vocabularyId))) return null;
  const meaning = await db
    .selectFrom("meanings")
    .where("id", "=", meaningId)
    .where("vocabulary_id", "=", vocabularyId)
    .select("id")
    .executeTakeFirst();
  if (!meaning) return null;

  const id = newUUID();
  const now = new Date().toISOString();
  await db
    .insertInto("examples")
    .values({
      id,
      meaning_id: meaningId,
      sentence: data.sentence,
      translation: data.translation ?? null,
      order_index: data.orderIndex ?? 0,
      created_at: now,
      updated_at: now,
    })
    .execute();

  return db.selectFrom("examples").where("id", "=", id).selectAll().executeTakeFirst();
}

export async function updateExample(
  db: Kysely<DB>,
  userId: string,
  vocabularyId: string,
  meaningId: string,
  exampleId: string,
  data: { sentence?: string; translation?: string | null; orderIndex?: number },
) {
  if (!(await assertOwner(db, userId, vocabularyId))) return null;
  const example = await db
    .selectFrom("examples")
    .where("id", "=", exampleId)
    .where("meaning_id", "=", meaningId)
    .select("id")
    .executeTakeFirst();
  if (!example) return null;

  const now = new Date().toISOString();
  await db
    .updateTable("examples")
    .set({
      ...(data.sentence !== undefined && { sentence: data.sentence }),
      ...(data.translation !== undefined && { translation: data.translation }),
      ...(data.orderIndex !== undefined && { order_index: data.orderIndex }),
      updated_at: now,
    })
    .where("id", "=", exampleId)
    .execute();

  return db.selectFrom("examples").where("id", "=", exampleId).selectAll().executeTakeFirst();
}

export async function deleteExample(
  db: Kysely<DB>,
  userId: string,
  vocabularyId: string,
  meaningId: string,
  exampleId: string,
) {
  if (!(await assertOwner(db, userId, vocabularyId))) return false;
  const example = await db
    .selectFrom("examples")
    .where("id", "=", exampleId)
    .where("meaning_id", "=", meaningId)
    .select("id")
    .executeTakeFirst();
  if (!example) return false;
  await db.deleteFrom("examples").where("id", "=", exampleId).execute();
  return true;
}
