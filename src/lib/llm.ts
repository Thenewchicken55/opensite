import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { generateMock } from "./mock-llm";
import type { DomActionType } from "./schema";

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

type ModelState = "loading" | "ready" | "error";
type ProgressCallback = (progress: number, text: string) => void;

let engine: MLCEngine | null = null;
let state: ModelState = "loading";
let errorMessage: string | null = null;

export type Backend = "webllm" | "mock";

export async function detectBackend(): Promise<Backend> {
  if (typeof navigator === "undefined") return "mock";
  const gpu = navigator as any;
  try {
    const adapter = await gpu.gpu?.requestAdapter?.();
    if (adapter) return "webllm";
  } catch {}
  return "mock";
}

export function getState(): ModelState {
  return state;
}

export function getErrorMessage(): string | null {
  return errorMessage;
}

let backendCache: Backend | null = null;

export async function getBackend(): Promise<Backend> {
  if (backendCache) return backendCache;
  backendCache = await detectBackend();
  return backendCache;
}

export async function initModel(onProgress?: ProgressCallback): Promise<void> {
  if (engine) return;

  state = "loading";
  errorMessage = null;

  try {
    engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        const progress = report.progress ?? 0;
        const text = report.text ?? "";
        onProgress?.(progress, text);
      },
    });
    state = "ready";
  } catch (err) {
    state = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

export async function generateActions(prompt: string, systemPrompt?: string): Promise<DomActionType[]> {
  const backend = await getBackend();

  if (backend === "mock") {
    return generateMock(prompt);
  }

  if (!engine) throw new Error("Model not initialized");

  const messages: ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const reply = await engine.chat.completions.create({
    messages,
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
  });

  const raw = reply.choices[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export function unloadModel(): void {
  engine = null;
  state = "loading";
  errorMessage = null;
  backendCache = null;
}
