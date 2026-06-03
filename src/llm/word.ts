import { z } from 'zod'
import { env } from '../config/env.js'
import { openrouter } from './client.js'

const ExampleSchema = z.object({
  sentence: z.string(),
  translation: z.string(),
})

const MeaningSchema = z.object({
  partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'phrase']),
  definition: z.string(),
  translation: z.string(),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  examples: z.array(ExampleSchema).min(1).max(2),
})

export const WordDataSchema = z.object({
  pronunciationUk: z.string(),
  pronunciationUs: z.string(),
  meanings: z.array(MeaningSchema).min(1).max(3),
})

export type LlmWordData = z.infer<typeof WordDataSchema>
export type LlmMeaning = z.infer<typeof MeaningSchema>

const MOCK_RESPONSE: LlmWordData = {
  pronunciationUk: '/wɜːd/',
  pronunciationUs: '/wɜːrd/',
  meanings: [
    {
      partOfSpeech: 'noun',
      definition: 'a single unit of language that has meaning and can be spoken or written',
      translation: 'từ, từ ngữ',
      cefrLevel: 'A1',
      examples: [
        {
          sentence: 'Can you spell that word for me?',
          translation: 'Bạn có thể đánh vần từ đó cho tôi không?',
        },
      ],
    },
  ],
}

const PROMPT = (word: string) =>
  `Generate a dictionary entry for the English word: "${word}". Include 1–3 most common meanings with 1–2 example sentences each. Provide Vietnamese translations.`

export async function generateWordData(word: string): Promise<LlmWordData> {
  if (!env.OPENROUTER_API_KEY) {
    console.warn('[llm] OPENROUTER_API_KEY not set, returning mock response')
    return { ...MOCK_RESPONSE, pronunciationUk: `/${word}/`, pronunciationUs: `/${word}/` }
  }

  console.info(`[llm] generating word data for "${word}"`)

  let response: unknown
  try {
    response = await openrouter.chat.send({
      chatRequest: {
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: PROMPT(word) }],
        temperature: 0.3,
        responseFormat: {
          type: 'json_schema',
          jsonSchema: {
            name: 'word_data',
            strict: true,
            schema: z.toJSONSchema(WordDataSchema) as { [k: string]: unknown },
          },
        },
      },
    })
  } catch (err) {
    console.error('[llm] SDK call failed:', err)
    throw err
  }

  const content = (response as { choices: { message: { content?: string | null } }[] })
    .choices[0]?.message?.content ?? ''

  console.info(`[llm] raw response content: ${content}`)

  try {
    return WordDataSchema.parse(JSON.parse(content))
  } catch (err) {
    console.error('[llm] response validation failed:', err)
    throw new Error('LLM returned invalid or unexpected JSON')
  }
}
