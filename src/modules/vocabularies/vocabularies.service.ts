import { prisma } from '../../db/prisma.js'
import { generateWordData } from '../../llm/index.js'
import { parsePagination } from '../../utils/response.js'

export async function createVocabulary(userId: string, word: string) {
  let llmData
  let llmError = false

  try {
    llmData = await generateWordData(word)
  } catch {
    llmError = true
    llmData = {
      pronunciationUk: null,
      pronunciationUs: null,
      meanings: [],
    }
  }

  const vocabulary = await prisma.vocabulary.create({
    data: {
      userId,
      word,
      pronunciationUk: llmData.pronunciationUk || null,
      pronunciationUs: llmData.pronunciationUs || null,
      meanings: {
        create: llmData.meanings.map((m, i) => ({
          partOfSpeech: m.partOfSpeech,
          definition: m.definition,
          translation: m.translation ?? null,
          cefrLevel: m.cefrLevel ?? null,
          orderIndex: i,
          examples: {
            create: m.examples.map((e, j) => ({
              sentence: e.sentence,
              translation: e.translation ?? null,
              orderIndex: j,
            })),
          },
        })),
      },
      reviewState: {
        create: { stage: 1, intervalDays: 0, repetitionCount: 0 },
      },
    },
    include: vocabularyInclude,
  })

  return { vocabulary, llmError }
}

export async function listVocabularies(
  userId: string,
  query: { page?: unknown; pageSize?: unknown; search?: unknown; tag?: unknown; stage?: unknown },
) {
  const { page, pageSize, skip, take } = parsePagination(query)

  const where = {
    userId,
    ...(query.search ? { word: { contains: String(query.search), mode: 'insensitive' as const } } : {}),
    ...(query.tag ? { tags: { some: { tag: String(query.tag) } } } : {}),
    ...(query.stage ? { reviewState: { stage: Number(query.stage) } } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.vocabulary.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: true,
        reviewState: { select: { stage: true, nextReviewAt: true } },
      },
    }),
    prisma.vocabulary.count({ where }),
  ])

  return { items, total, page, pageSize }
}

export async function getDueVocabularies(userId: string, limit: number) {
  return prisma.vocabulary.findMany({
    where: {
      userId,
      reviewState: { nextReviewAt: { lte: new Date() } },
    },
    take: limit,
    orderBy: { reviewState: { nextReviewAt: 'asc' } },
    include: vocabularyInclude,
  })
}

export async function getVocabularyById(userId: string, id: string) {
  return prisma.vocabulary.findFirst({
    where: { id, userId },
    include: vocabularyInclude,
  })
}

export async function updateVocabulary(
  userId: string,
  id: string,
  data: {
    word?: string
    pronunciationUk?: string | null
    pronunciationUs?: string | null
    note?: string | null
    source?: string
    tags?: string[]
  },
) {
  const existing = await prisma.vocabulary.findFirst({ where: { id, userId } })
  if (!existing) return null

  const { tags, ...fields } = data

  return prisma.vocabulary.update({
    where: { id },
    data: {
      ...fields,
      ...(tags !== undefined && {
        tags: {
          deleteMany: {},
          create: tags.map((tag) => ({ tag })),
        },
      }),
    },
    include: vocabularyInclude,
  })
}

export async function deleteVocabulary(userId: string, id: string) {
  const existing = await prisma.vocabulary.findFirst({ where: { id, userId } })
  if (!existing) return false
  await prisma.vocabulary.delete({ where: { id } })
  return true
}

const vocabularyInclude = {
  tags: true,
  meanings: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      examples: { orderBy: { orderIndex: 'asc' as const } },
    },
  },
  reviewState: true,
}
