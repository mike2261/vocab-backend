import { z } from 'zod'

export const exampleSchema = z.object({
  sentence: z.string().min(1).max(1000),
  translation: z.string().max(1000).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
})

export const createMeaningSchema = z.object({
  partOfSpeech: z.string().min(1).max(50),
  definition: z.string().min(1).max(2000),
  translation: z.string().max(2000).nullable().optional(),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
  examples: z.array(exampleSchema).optional(),
})

export const updateMeaningSchema = z.object({
  partOfSpeech: z.string().min(1).max(50).optional(),
  definition: z.string().min(1).max(2000).optional(),
  translation: z.string().max(2000).nullable().optional(),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
})

export const createExampleSchema = z.object({
  sentence: z.string().min(1).max(1000),
  translation: z.string().max(1000).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
})

export const updateExampleSchema = z.object({
  sentence: z.string().min(1).max(1000).optional(),
  translation: z.string().max(1000).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
})
