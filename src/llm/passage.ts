import { openrouterChat } from "./client";

const PASSAGE_JSON_SCHEMA = {
  type: "object",
  properties: {
    passage: { type: "string" },
  },
  required: ["passage"],
  additionalProperties: false,
};

export async function generatePassage(words: string[], topic: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    return `This is a sample passage about ${topic}. It naturally incorporates vocabulary like ${words.slice(0, 5).join(", ")}.`;
  }

  const wordList = words.join(", ");

  const response = await openrouterChat(
    apiKey,
    "openrouter/auto",
    [
      {
        role: "user",
        content: `Write an engaging English reading passage of 150–200 words on the topic of "${topic}".
Naturally incorporate as many of these vocabulary words as possible: ${wordList}.
Requirements:
- B1–B2 CEFR level
- Well-structured with a clear flow
- Only use words that fit naturally — do not force them in awkwardly`,
      },
    ],
    {
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: { name: "passage_data", strict: true, schema: PASSAGE_JSON_SCHEMA },
      },
    },
  );

  const rawContent = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(rawContent) as { passage: string };
  return parsed.passage;
}
