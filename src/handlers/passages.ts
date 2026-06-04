import { type } from "arktype";
import { Hono } from "hono";
import type { AppContext } from "../fetch";
import { middlewareJWT } from "../hxxp/auth";
import { AppError } from "../hxxp/error";
import { validate } from "../hxxp/validator";
import { generatePassage } from "../llm/passage";

const schemaGenerate = type({
  wordIds: "string[]",
  topic: "string >= 1",
});

const passages = new Hono<AppContext>();

passages.use("*", middlewareJWT);

passages.post("/generate", validate("json", schemaGenerate), async (c) => {
  const { wordIds, topic } = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");

  if (wordIds.length === 0) throw new AppError("Validation", "wordIds must not be empty");

  const vocabs = await db
    .selectFrom("vocabularies")
    .where("user_id", "=", userId)
    .where("id", "in", wordIds)
    .select(["id", "word"])
    .execute();

  if (vocabs.length === 0) throw new AppError("NotExist", "No valid vocabulary words found");

  const words = vocabs.map((v) => v.word);
  const passage = await generatePassage(words, topic, c.env.OPENROUTER_API_KEY);

  return c.json({ data: { passage } });
});

export default passages;
