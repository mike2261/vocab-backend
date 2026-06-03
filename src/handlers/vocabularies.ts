import { type } from "arktype";
import { Hono } from "hono";
import type { AppContext } from "../fetch";
import { middlewareJWT } from "../hxxp/auth";
import { AppError } from "../hxxp/error";
import { validate } from "../hxxp/validator";
import * as meaningsService from "../services/meanings";
import * as vocabService from "../services/vocabulary";

const schemaCreate = type({ word: "string >= 1" });
const schemaUpdate = type({
  "word?": "string",
  "pronunciation_uk?": "string | null",
  "pronunciation_us?": "string | null",
  "note?": "string | null",
  "source?": "string",
  "tags?": "string[]",
});
const schemaListQuery = type({
  "page?": "string.integer.parse | number.integer",
  "pageSize?": "string.integer.parse | number.integer",
  "search?": "string",
  "tag?": "string",
  "stage?": "string.integer.parse | number.integer",
});
const schemaDueQuery = type({ "limit?": "string.integer.parse | number.integer" });

const schemaMeaning = type({
  partOfSpeech: "string",
  definition: "string",
  "translation?": "string | null",
  "cefrLevel?": "string | null",
  "orderIndex?": "number.integer",
  "examples?": type({ sentence: "string", "translation?": "string | null", "orderIndex?": "number.integer" }).array(),
});
const schemaUpdateMeaning = type({
  "partOfSpeech?": "string",
  "definition?": "string",
  "translation?": "string | null",
  "cefrLevel?": "string | null",
  "orderIndex?": "number.integer",
});
const schemaExample = type({ sentence: "string", "translation?": "string | null", "orderIndex?": "number.integer" });
const schemaUpdateExample = type({
  "sentence?": "string",
  "translation?": "string | null",
  "orderIndex?": "number.integer",
});

const vocabularies = new Hono<AppContext>();

vocabularies.use("*", middlewareJWT);

vocabularies.post("/", validate("json", schemaCreate), async (c) => {
  const { word } = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");

  const { vocabulary, llmError } = await vocabService.createVocabulary(db, userId, word, c.env.OPENROUTER_API_KEY);
  return c.json(
    {
      data: vocabulary,
      ...(llmError && { warning: "LLM generation failed, word saved without definitions" }),
    },
    201,
  );
});

vocabularies.get("/", validate("query", schemaListQuery), async (c) => {
  const query = c.req.valid("query");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");

  const { items, total, page, pageSize } = await vocabService.listVocabularies(db, userId, {
    page: typeof query.page === "number" ? query.page : undefined,
    pageSize: typeof query.pageSize === "number" ? query.pageSize : undefined,
    search: query.search,
    tag: query.tag,
    stage: typeof query.stage === "number" ? query.stage : undefined,
  });

  return c.json({ data: items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

vocabularies.get("/due", validate("query", schemaDueQuery), async (c) => {
  const query = c.req.valid("query");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const limit = typeof query.limit === "number" ? Math.min(query.limit, 100) : 20;
  const items = await vocabService.getDueVocabularies(db, userId, limit);
  return c.json({ data: items });
});

vocabularies.get("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const vocab = await vocabService.getVocabularyById(db, userId, id);
  if (!vocab) throw new AppError("NotExist", "Vocabulary not found");
  return c.json({ data: vocab });
});

vocabularies.patch("/:id", validate("json", schemaUpdate), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const vocab = await vocabService.updateVocabulary(db, userId, id, body);
  if (!vocab) throw new AppError("NotExist", "Vocabulary not found");
  return c.json({ data: vocab });
});

vocabularies.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const deleted = await vocabService.deleteVocabulary(db, userId, id);
  if (!deleted) throw new AppError("NotExist", "Vocabulary not found");
  return c.body(null, 204);
});

// ---- Meanings ----

vocabularies.post("/:id/meanings", validate("json", schemaMeaning), async (c) => {
  const vocabId = c.req.param("id");
  const body = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const meaning = await meaningsService.createMeaning(db, userId, vocabId, body);
  if (!meaning) throw new AppError("NotExist", "Vocabulary not found");
  return c.json({ data: meaning }, 201);
});

vocabularies.patch("/:id/meanings/:mId", validate("json", schemaUpdateMeaning), async (c) => {
  const vocabId = c.req.param("id");
  const meaningId = c.req.param("mId");
  const body = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const meaning = await meaningsService.updateMeaning(db, userId, vocabId, meaningId, body);
  if (!meaning) throw new AppError("NotExist", "Meaning not found");
  return c.json({ data: meaning });
});

vocabularies.delete("/:id/meanings/:mId", async (c) => {
  const vocabId = c.req.param("id");
  const meaningId = c.req.param("mId");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const deleted = await meaningsService.deleteMeaning(db, userId, vocabId, meaningId);
  if (!deleted) throw new AppError("NotExist", "Meaning not found");
  return c.body(null, 204);
});

// ---- Examples ----

vocabularies.post("/:id/meanings/:mId/examples", validate("json", schemaExample), async (c) => {
  const vocabId = c.req.param("id");
  const meaningId = c.req.param("mId");
  const body = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const example = await meaningsService.createExample(db, userId, vocabId, meaningId, body);
  if (!example) throw new AppError("NotExist", "Meaning not found");
  return c.json({ data: example }, 201);
});

vocabularies.patch("/:id/meanings/:mId/examples/:eId", validate("json", schemaUpdateExample), async (c) => {
  const vocabId = c.req.param("id");
  const meaningId = c.req.param("mId");
  const exampleId = c.req.param("eId");
  const body = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const example = await meaningsService.updateExample(db, userId, vocabId, meaningId, exampleId, body);
  if (!example) throw new AppError("NotExist", "Example not found");
  return c.json({ data: example });
});

vocabularies.delete("/:id/meanings/:mId/examples/:eId", async (c) => {
  const vocabId = c.req.param("id");
  const meaningId = c.req.param("mId");
  const exampleId = c.req.param("eId");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");
  const deleted = await meaningsService.deleteExample(db, userId, vocabId, meaningId, exampleId);
  if (!deleted) throw new AppError("NotExist", "Example not found");
  return c.body(null, 204);
});

export default vocabularies;
