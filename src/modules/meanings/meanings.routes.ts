import type { FastifyInstance } from 'fastify'
import {
  createMeaningHandler,
  updateMeaningHandler,
  deleteMeaningHandler,
  createExampleHandler,
  updateExampleHandler,
  deleteExampleHandler,
} from './meanings.controller.js'

export async function meaningsRoutes(app: FastifyInstance) {
  // Meanings
  app.post('/:id/meanings', createMeaningHandler)
  app.patch('/:id/meanings/:mId', updateMeaningHandler)
  app.delete('/:id/meanings/:mId', deleteMeaningHandler)

  // Examples
  app.post('/:id/meanings/:mId/examples', createExampleHandler)
  app.patch('/:id/meanings/:mId/examples/:eId', updateExampleHandler)
  app.delete('/:id/meanings/:mId/examples/:eId', deleteExampleHandler)
}
