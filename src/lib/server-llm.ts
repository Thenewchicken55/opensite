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

export function extractJson(raw: string): string {
  let cleaned = raw.trim();

  // Try code block with array first
  const arrayBlock = cleaned.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (arrayBlock) return arrayBlock[1];

  // Try code block with object (wrap in array)
  const objectBlock = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (objectBlock) return `[${objectBlock[1]}]`;

  // Find outermost array brackets
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }

  // Find outermost object brackets (single action, wrap in array)
  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    return `[${cleaned.slice(objStart, objEnd + 1)}]`;
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
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(
        `Model returned non-JSON response. Try lowering the temperature or using a different model. Response preview: ${raw.slice(0, 200)}`,
      );
    }
  }
}
