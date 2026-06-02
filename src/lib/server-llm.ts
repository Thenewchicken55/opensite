import type { DomActionType } from "./schema";

export interface ServerLLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = "opensite-llm-config";

export function loadServerConfig(): ServerLLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { baseUrl: "http://localhost:11434/v1", apiKey: "ollama", model: "qwen2.5" };
}

export function saveServerConfig(config: ServerLLMConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function generateWithServer(
  prompt: string,
  systemPrompt: string,
  config: ServerLLMConfig,
): Promise<DomActionType[]> {
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
  };

  const res = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new Error(`Server LLM (${res.status}): ${text}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();

  return JSON.parse(cleaned);
}
