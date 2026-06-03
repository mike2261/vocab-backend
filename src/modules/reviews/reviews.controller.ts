import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as service from './reviews.service.js'

const DEV_USER_ID = 'dev-user-id'

const reviewSchema = z.object({
  rating: z.enum(['forgot', 'hard', 'good', 'easy']),
})

const historyQuerySchema = z.object({
  vocabularyId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export async function reviewVocabularyHandler(req: FastifyRequest, reply: FastifyReply) {
  const { vocabularyId } = req.params as { vocabularyId: string }
  const { rating } = reviewSchema.parse(req.body)

  const state = await service.reviewVocabulary(DEV_USER_ID, vocabularyId, rating)
  if (!state) {
    return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vocabulary not found' } })
  }

  return reply.send({ data: state })
}

export async function getReviewHistoryHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = historyQuerySchema.parse(req.query)
  const { items, total, page, pageSize } = await service.getReviewHistory(DEV_USER_ID, query)
  return reply.send({
    data: items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}
