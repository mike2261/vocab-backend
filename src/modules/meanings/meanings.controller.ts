import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createMeaningSchema,
  updateMeaningSchema,
  createExampleSchema,
  updateExampleSchema,
} from './meanings.schema.js'
import * as service from './meanings.service.js'

const DEV_USER_ID = 'dev-user-id'

type VocabParams = { id: string }
type MeaningParams = { id: string; mId: string }
type ExampleParams = { id: string; mId: string; eId: string }

const notFound = (reply: FastifyReply, message: string) =>
  reply.status(404).send({ error: { code: 'NOT_FOUND', message } })

export async function createMeaningHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as VocabParams
  const body = createMeaningSchema.parse(req.body)
  const meaning = await service.createMeaning(DEV_USER_ID, id, body)
  if (!meaning) return notFound(reply, 'Vocabulary not found')
  return reply.status(201).send({ data: meaning })
}

export async function updateMeaningHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id, mId } = req.params as MeaningParams
  const body = updateMeaningSchema.parse(req.body)
  const meaning = await service.updateMeaning(DEV_USER_ID, id, mId, body)
  if (!meaning) return notFound(reply, 'Meaning not found')
  return reply.send({ data: meaning })
}

export async function deleteMeaningHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id, mId } = req.params as MeaningParams
  const deleted = await service.deleteMeaning(DEV_USER_ID, id, mId)
  if (!deleted) return notFound(reply, 'Meaning not found')
  return reply.status(204).send()
}

export async function createExampleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id, mId } = req.params as MeaningParams
  const body = createExampleSchema.parse(req.body)
  const example = await service.createExample(DEV_USER_ID, id, mId, body)
  if (!example) return notFound(reply, 'Meaning not found')
  return reply.status(201).send({ data: example })
}

export async function updateExampleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id, mId, eId } = req.params as ExampleParams
  const body = updateExampleSchema.parse(req.body)
  const example = await service.updateExample(DEV_USER_ID, id, mId, eId, body)
  if (!example) return notFound(reply, 'Example not found')
  return reply.send({ data: example })
}

export async function deleteExampleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id, mId, eId } = req.params as ExampleParams
  const deleted = await service.deleteExample(DEV_USER_ID, id, mId, eId)
  if (!deleted) return notFound(reply, 'Example not found')
  return reply.status(204).send()
}
