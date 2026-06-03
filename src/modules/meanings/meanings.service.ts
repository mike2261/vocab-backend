import { prisma } from '../../db/prisma.js'

async function assertVocabularyOwner(userId: string, vocabularyId: string) {
  const vocab = await prisma.vocabulary.findFirst({ where: { id: vocabularyId, userId } })
  return vocab !== null
}

export async function createMeaning(
  userId: string,
  vocabularyId: string,
  data: {
    partOfSpeech: string
    definition: string
    translation?: string | null
    cefrLevel?: string | null
    orderIndex?: number
    examples?: { sentence: string; translation?: string | null; orderIndex?: number }[]
  },
) {
  if (!(await assertVocabularyOwner(userId, vocabularyId))) return null

  return prisma.meaning.create({
    data: {
      vocabularyId,
      partOfSpeech: data.partOfSpeech,
      definition: data.definition,
      translation: data.translation ?? null,
      cefrLevel: data.cefrLevel ?? null,
      orderIndex: data.orderIndex ?? 0,
      examples: {
        create: (data.examples ?? []).map((e, i) => ({
          sentence: e.sentence,
          translation: e.translation ?? null,
          orderIndex: e.orderIndex ?? i,
        })),
      },
    },
    include: { examples: { orderBy: { orderIndex: 'asc' } } },
  })
}

export async function updateMeaning(
  userId: string,
  vocabularyId: string,
  meaningId: string,
  data: {
    partOfSpeech?: string
    definition?: string
    translation?: string | null
    cefrLevel?: string | null
    orderIndex?: number
  },
) {
  if (!(await assertVocabularyOwner(userId, vocabularyId))) return null
  const meaning = await prisma.meaning.findFirst({ where: { id: meaningId, vocabularyId } })
  if (!meaning) return null
  return prisma.meaning.update({ where: { id: meaningId }, data })
}

export async function deleteMeaning(userId: string, vocabularyId: string, meaningId: string) {
  if (!(await assertVocabularyOwner(userId, vocabularyId))) return false
  const meaning = await prisma.meaning.findFirst({ where: { id: meaningId, vocabularyId } })
  if (!meaning) return false
  await prisma.meaning.delete({ where: { id: meaningId } })
  return true
}

export async function createExample(
  userId: string,
  vocabularyId: string,
  meaningId: string,
  data: { sentence: string; translation?: string | null; orderIndex?: number },
) {
  if (!(await assertVocabularyOwner(userId, vocabularyId))) return null
  const meaning = await prisma.meaning.findFirst({ where: { id: meaningId, vocabularyId } })
  if (!meaning) return null
  return prisma.example.create({
    data: {
      meaningId,
      sentence: data.sentence,
      translation: data.translation ?? null,
      orderIndex: data.orderIndex ?? 0,
    },
  })
}

export async function updateExample(
  userId: string,
  vocabularyId: string,
  meaningId: string,
  exampleId: string,
  data: { sentence?: string; translation?: string | null; orderIndex?: number },
) {
  if (!(await assertVocabularyOwner(userId, vocabularyId))) return null
  const example = await prisma.example.findFirst({ where: { id: exampleId, meaningId } })
  if (!example) return null
  return prisma.example.update({ where: { id: exampleId }, data })
}

export async function deleteExample(
  userId: string,
  vocabularyId: string,
  meaningId: string,
  exampleId: string,
) {
  if (!(await assertVocabularyOwner(userId, vocabularyId))) return false
  const example = await prisma.example.findFirst({ where: { id: exampleId, meaningId } })
  if (!example) return false
  await prisma.example.delete({ where: { id: exampleId } })
  return true
}
