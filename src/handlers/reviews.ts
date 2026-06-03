import { type } from "arktype";
import { Hono } from "hono";
import type { AppContext } from "../fetch";
import { middlewareJWT } from "../hxxp/auth";
import { AppError } from "../hxxp/error";
import { validate } from "../hxxp/validator";
import * as reviewsService from "../services/reviews";

const schemaReview = type({ rating: "'forgot'|'hard'|'good'|'easy'" });
const schemaHistoryQuery = type({
  "vocabularyId?": "string",
  "page?": "string.integer.parse | number.integer",
  "pageSize?": "string.integer.parse | number.integer",
});

const reviews = new Hono<AppContext>();

reviews.use("*", middlewareJWT);

reviews.post("/:vocabularyId", validate("json", schemaReview), async (c) => {
  const vocabularyId = c.req.param("vocabularyId");
  const { rating } = c.req.valid("json");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");

  const state = await reviewsService.reviewVocabulary(db, userId, vocabularyId, rating);
  if (!state) throw new AppError("NotExist", "Vocabulary not found");

  return c.json({ data: state });
});

reviews.get("/history", validate("query", schemaHistoryQuery), async (c) => {
  const query = c.req.valid("query");
  const userId = String(c.get("jwtPayload").sub);
  const db = c.get("db");

  const { items, total, page, pageSize } = await reviewsService.getReviewHistory(db, userId, {
    vocabularyId: query.vocabularyId,
    page: typeof query.page === "number" ? query.page : undefined,
    pageSize: typeof query.pageSize === "number" ? query.pageSize : undefined,
  });

  return c.json({ data: items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

export default reviews;
