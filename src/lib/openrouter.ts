const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-5.4-mini";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function chat(messages: Message[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://claimax.app",
      "X-OpenRouter-Title": "Claimax Medical Transcription",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenRouter API error: ${res.status} ${error}`);
  }

  const data: OpenRouterResponse = await res.json();
  return data.choices[0]?.message?.content ?? "";
}
