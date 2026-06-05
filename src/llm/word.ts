import { type } from "arktype";
import { openrouterChat } from "./client";

const ExampleSchema = type({ sentence: "string", translation: "string" });

const MeaningSchema = type({
  partOfSpeech: "'noun'|'verb'|'adjective'|'adverb'|'phrase'",
  definition: "string",
  translation: "string",
  cefrLevel: "'A1'|'A2'|'B1'|'B2'|'C1'|'C2'",
  examples: ExampleSchema.array().atLeastLength(1).atMostLength(2),
});

export const WordDataSchema = type({
  pronunciationUk: "string",
  pronunciationUs: "string",
  meanings: MeaningSchema.array().atLeastLength(1).atMostLength(3),
});

export type LlmWordData = typeof WordDataSchema.infer;
export type LlmMeaning = typeof MeaningSchema.infer;

const WORD_DATA_JSON_SCHEMA = {
  type: "object",
  properties: {
    pronunciationUk: { type: "string" },
    pronunciationUs: { type: "string" },
    meanings: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          partOfSpeech: { type: "string", enum: ["noun", "verb", "adjective", "adverb", "phrase"] },
          definition: { type: "string" },
          translation: { type: "string" },
          cefrLevel: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
          examples: {
            type: "array",
            minItems: 1,
            maxItems: 2,
            items: {
              type: "object",
              properties: {
                sentence: { type: "string" },
                translation: { type: "string" },
              },
              required: ["sentence", "translation"],
              additionalProperties: false,
            },
          },
        },
        required: ["partOfSpeech", "definition", "translation", "cefrLevel", "examples"],
        additionalProperties: false,
      },
    },
  },
  required: ["pronunciationUk", "pronunciationUs", "meanings"],
  additionalProperties: false,
};

const MOCK_RESPONSE: LlmWordData = {
  pronunciationUk: "/wɜːd/",
  pronunciationUs: "/wɜːrd/",
  meanings: [
    {
      partOfSpeech: "noun",
      definition: "a single unit of language that has meaning and can be spoken or written",
      translation: "từ, từ ngữ",
      cefrLevel: "A1",
      examples: [
        { sentence: "Can you spell that word for me?", translation: "Bạn có thể đánh vần từ đó cho tôi không?" },
      ],
    },
  ],
};

function parseJsonContent(rawContent: string): unknown {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    throw new Error("LLM returned empty content");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    if (fencedJson) {
      return JSON.parse(fencedJson);
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error("LLM returned non-JSON content");
  }
}

function extractWordDataCandidate(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  for (const key of ["wordData", "word_data", "vocabulary", "entry", "data", "result"]) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedRecord = nested as Record<string, unknown>;
      if ("meanings" in nestedRecord || "pronunciationUk" in nestedRecord || "pronunciationUs" in nestedRecord) {
        return nested;
      }
    }
  }

  return value;
}

export async function generateWordData(word: string, apiKey: string): Promise<LlmWordData> {
  if (!apiKey) {
    console.warn("[llm] OPENROUTER_API_KEY not set, returning mock response");
    return { ...MOCK_RESPONSE, pronunciationUk: `/${word}/`, pronunciationUs: `/${word}/` };
  }

  console.info(`[llm] generating word data for "${word}"`);

  let rawContent: string;
  try {
    const response = await openrouterChat(
      apiKey,
      "openrouter/auto",
      [
        {
          role: "system",
          content:
            "Return only JSON that matches the provided schema. Do not wrap the object in another property, markdown, or explanatory text.",
        },
        {
          role: "user",
          content: `Generate a dictionary entry for the English word: "${word}". Include 1–3 most common meanings with 1–2 example sentences each. Provide Vietnamese translations.`,
        },
      ],
      {
        temperature: 0.3,
        response_format: {
          type: "json_schema",
          json_schema: { name: "word_data", strict: true, schema: WORD_DATA_JSON_SCHEMA },
        },
      },
    );

    rawContent = response.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[llm] API call failed:", err);
    throw err;
  }

  console.info(`[llm] raw response: ${rawContent}`);

  const json = extractWordDataCandidate(parseJsonContent(rawContent));
  const parsed = WordDataSchema(json);
  if (parsed instanceof type.errors) {
    console.warn("[llm] response validation failed:", parsed.summary);
    throw new Error("LLM returned invalid JSON");
  }

  return parsed;
}
