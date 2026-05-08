const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4.1-mini";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  temperature?: number;
  model?: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function chat(
  messages: Message[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://medscribe.app",
      "X-OpenRouter-Title": "Medscribe Medical Transcription",
    },
    body: JSON.stringify({
      model: options.model || MODEL,
      messages,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenRouter API error: ${res.status} ${error}`);
  }

  const data: OpenRouterResponse = await res.json();
  return data.choices[0]?.message?.content ?? "";
}
