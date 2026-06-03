import { z } from 'zod'

export const createVocabularySchema = z.object({
  word: z.string().min(1).max(200).trim(),
})

export const updateVocabularySchema = z.object({
  word: z.string().min(1).max(200).trim().optional(),
  pronunciationUk: z.string().max(100).nullable().optional(),
  pronunciationUs: z.string().max(100).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  source: z.string().max(100).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
})

export const listVocabulariesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
  tag: z.string().max(50).optional(),
  stage: z.coerce.number().int().min(1).max(5).optional(),
})

export const dueVocabulariesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>
