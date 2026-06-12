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

/** Try to extract a complete HTML document from an LLM response */
function extractHtmlBlock(raw: string): string | null {
  const match = raw.match(/```html\s*([\s\S]*?)\s*```/);
  return match ? match[1].trim() : null;
}

/** Strip <style>, <link>, and <base> tags that leak to the global page */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<base[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "");
}

export function extractJson(raw: string): string {
  const cleaned = raw.trim();

  // Try code block with array first
  const arrayBlock = cleaned.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (arrayBlock) return arrayBlock[1];

  // Try code block with object (wrap in array)
  const objectBlock = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (objectBlock) return `[${objectBlock[1]}]`;

  // Try {"actions": [...]} wrapper — extract the inner array
  const actionsMatch = cleaned.match(/"actions"\s*:\s*(\[[\s\S]*?\])/);
  if (actionsMatch) return actionsMatch[1];

  // Find outermost array brackets with depth tracking
  // This handles truncated or partially-broken JSON
  const startsAt = cleaned.indexOf("[");
  if (startsAt === -1) {
    // No array, try single object
    return wrapFirstObject(cleaned) ?? cleaned;
  }

  // Walk the array and track bracket/string depth to find the true end
  let i = startsAt;
  let arrayDepth = 0;
  let inString = false;
  let escape = false;
  let validEnd = -1;

  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (escape) {
      escape = false;
    } else if (inString) {
      if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === '[') {
        arrayDepth++;
      } else if (ch === ']') {
        arrayDepth--;
        if (arrayDepth === 0) {
          validEnd = i;
          break;
        }
      } else if (ch === '{') {
        // Skip to matching } — handles objects inside the array
        const objEnd = findMatchingBrace(cleaned, i);
        if (objEnd === -1) break; // truncated object, stop here
        i = objEnd;
      }
    }
    i++;
  }

  if (validEnd !== -1) {
    return cleaned.slice(startsAt, validEnd + 1);
  }

  // If array is incomplete, try to extract what we can
  if (arrayDepth > 0) {
    // Find the last complete object inside the partial array
    const partial = cleaned.slice(startsAt);
    const lastObjEnd = findLastCompleteObject(partial);
    if (lastObjEnd !== -1) {
      return partial.slice(0, lastObjEnd + 1) + "]";
    }
  }

  return wrapFirstObject(cleaned) ?? cleaned;
}

/** Find matching closing brace from a position, handling strings and nesting */
function findMatchingBrace(s: string, start: number): number {
  let depth = 1;
  let inStr = false;
  let esc = false;
  let i = start + 1;
  while (i < s.length) {
    const ch = s[i];
    if (esc) {
      esc = false;
    } else if (inStr) {
      if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    i++;
  }
  return -1;
}

/** Wrap the first complete top-level object in an array */
function wrapFirstObject(s: string): string | null {
  let depth = 0;
  let objStart = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) {
      esc = false;
    } else if (inStr) {
      if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          return `[${s.slice(objStart, i + 1)}]`;
        }
      }
    }
  }
  return null;
}

/** Find the last complete object in a string (for partial array recovery) */
function findLastCompleteObject(s: string): number {
  let depth = 0;
  let inStr = false;
  let esc = false;
  let lastEnd = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) {
      esc = false;
    } else if (inStr) {
      if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) lastEnd = i;
      }
    }
  }
  return lastEnd;
}

export async function generateWithServer(
  messages: ChatMessage[],
  config: ServerLLMConfig,
): Promise<DomActionType[]> {
  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: 16384,
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

  // Try HTML code block first — LLMs generate HTML much more reliably
  const html = extractHtmlBlock(raw);
  if (html) {
    const clean = sanitizeHtml(html);
    return [{ action: "clear" as const }, { action: "setHTML" as const, selector: "#canvas", content: clean }];
  }

  const cleaned = extractJson(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Model returned non-JSON response. Try lowering the temperature or switching to a larger model. Preview: ${raw.slice(0, 500)}`,
    );
  }
}
