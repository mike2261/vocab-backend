import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createVocabularySchema,
  updateVocabularySchema,
  listVocabulariesSchema,
  dueVocabulariesSchema,
} from './vocabularies.schema.js'
import * as service from './vocabularies.service.js'

// Temporary: hardcoded userId until auth is implemented
const DEV_USER_ID = 'dev-user-id'

export async function createVocabularyHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = createVocabularySchema.parse(req.body)
  const { vocabulary, llmError } = await service.createVocabulary(DEV_USER_ID, body.word)
  return reply.status(201).send({
    data: vocabulary,
    ...(llmError && { warning: 'LLM generation failed, word saved without definitions' }),
  })
}

export async function listVocabulariesHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listVocabulariesSchema.parse(req.query)
  const { items, total, page, pageSize } = await service.listVocabularies(DEV_USER_ID, query)
  return reply.send({
    data: items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}

export async function getDueVocabulariesHandler(req: FastifyRequest, reply: FastifyReply) {
  const { limit } = dueVocabulariesSchema.parse(req.query)
  const items = await service.getDueVocabularies(DEV_USER_ID, limit)
  return reply.send({ data: items })
}

export async function getVocabularyHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const vocabulary = await service.getVocabularyById(DEV_USER_ID, id)
  if (!vocabulary) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vocabulary not found' } })
  return reply.send({ data: vocabulary })
}

export async function updateVocabularyHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const body = updateVocabularySchema.parse(req.body)
  const vocabulary = await service.updateVocabulary(DEV_USER_ID, id, body)
  if (!vocabulary) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vocabulary not found' } })
  return reply.send({ data: vocabulary })
}

export async function deleteVocabularyHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const deleted = await service.deleteVocabulary(DEV_USER_ID, id)
  if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vocabulary not found' } })
  return reply.status(204).send()
}
