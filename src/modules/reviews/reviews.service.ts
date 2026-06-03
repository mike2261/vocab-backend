import { prisma } from '../../db/prisma.js'
import { calculateNextReview, type ReviewRating } from './repetition.js'
import { parsePagination } from '../../utils/response.js'

export async function reviewVocabulary(userId: string, vocabularyId: string, rating: ReviewRating) {
  const vocabulary = await prisma.vocabulary.findFirst({
    where: { id: vocabularyId, userId },
    include: { reviewState: true },
  })

  if (!vocabulary) return null
  if (!vocabulary.reviewState) return null

  const state = vocabulary.reviewState
  const next = calculateNextReview(
    {
      stage: state.stage,
      repetitionCount: state.repetitionCount,
      intervalDays: state.intervalDays,
      easeFactor: Number(state.easeFactor),
    },
    rating,
  )

  const [updatedState] = await prisma.$transaction([
    prisma.reviewState.update({
      where: { vocabularyId },
      data: {
        stage: next.stage,
        repetitionCount: next.repetitionCount,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        lastReviewedAt: new Date(),
        nextReviewAt: next.nextReviewAt,
      },
    }),
    prisma.reviewLog.create({
      data: {
        vocabularyId,
        rating,
        previousStage: state.stage,
        nextStage: next.stage,
        previousIntervalDays: state.intervalDays,
        nextIntervalDays: next.intervalDays,
      },
    }),
  ])

  return updatedState
}

export async function getReviewHistory(
  userId: string,
  query: { vocabularyId?: unknown; page?: unknown; pageSize?: unknown },
) {
  const { page, pageSize, skip, take } = parsePagination(query)

  const where = {
    vocabulary: { userId },
    ...(query.vocabularyId ? { vocabularyId: String(query.vocabularyId) } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.reviewLog.findMany({
      where,
      skip,
      take,
      orderBy: { reviewedAt: 'desc' },
      include: { vocabulary: { select: { word: true } } },
    }),
    prisma.reviewLog.count({ where }),
  ])

  return { items, total, page, pageSize }
}
