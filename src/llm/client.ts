export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterResponse {
  choices: { message: { content: string | null } }[];
}

export async function openrouterChat(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  options: {
    temperature?: number;
    response_format?: { type: "json_schema"; json_schema: { name: string; strict: boolean; schema: unknown } };
  } = {},
): Promise<OpenRouterResponse> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, ...options }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${text}`);
  }

  return (await res.json()) as OpenRouterResponse;
}
