import type { FastifyInstance } from 'fastify'
import {
  createVocabularyHandler,
  listVocabulariesHandler,
  getDueVocabulariesHandler,
  getVocabularyHandler,
  updateVocabularyHandler,
  deleteVocabularyHandler,
} from './vocabularies.controller.js'

export async function vocabulariesRoutes(app: FastifyInstance) {
  app.post('/', createVocabularyHandler)
  app.get('/', listVocabulariesHandler)
  app.get('/due', getDueVocabulariesHandler)
  app.get('/:id', getVocabularyHandler)
  app.patch('/:id', updateVocabularyHandler)
  app.delete('/:id', deleteVocabularyHandler)
}
