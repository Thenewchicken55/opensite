import type { DomActionType } from "./schema";

export interface ServerLLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "opensite-llm-config";

const DEFAULTS: ServerLLMConfig = {
  baseUrl: "http://localhost:11434/v1",
  apiKey: "ollama",
  model: "llama3.2",
  temperature: 0.7,
};

export function loadServerConfig(): ServerLLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {}
  return { ...DEFAULTS };
}

export function saveServerConfig(config: ServerLLMConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function extractJson(raw: string): string {
  let cleaned = raw.trim();

  const jsonMatch = cleaned.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (jsonMatch) return jsonMatch[1];

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
  }

  return cleaned;
}

export async function generateWithServer(
  messages: ChatMessage[],
  config: ServerLLMConfig,
): Promise<DomActionType[]> {
  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
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
    const isModelNotFound =
      text.toLowerCase().includes("model") && text.toLowerCase().includes("not found");
    const hint = isModelNotFound ? `\n\nRun: ollama pull ${config.model}` : "";
    throw new Error(`Server LLM (${res.status}): ${text}${hint}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  const cleaned = extractJson(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    const trimmed = cleaned
      .replace(/^[^[]*/, "")
      .replace(/[^\]]*$/, "");
    return JSON.parse(trimmed);
  }
}
