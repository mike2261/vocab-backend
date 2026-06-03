import type { FastifyInstance } from 'fastify'
import { reviewVocabularyHandler, getReviewHistoryHandler } from './reviews.controller.js'

export async function reviewsRoutes(app: FastifyInstance) {
  app.post('/:vocabularyId', reviewVocabularyHandler)
  app.get('/history', getReviewHistoryHandler)
}
