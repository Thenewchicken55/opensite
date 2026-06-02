import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { generateMock } from "./mock-llm";
import { generateWithServer, loadServerConfig } from "./server-llm";
import type { DomActionType } from "./schema";

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
const FALLBACK_MODEL_ID = "Phi-3-mini-4k-instruct-q4f16_1-MLC";

export type Backend = "webllm" | "server" | "mock";

type ModelState = "loading" | "ready" | "error" | "unavailable";
type ProgressCallback = (progress: number, text: string) => void;

let engine: MLCEngine | null = null;
let state: ModelState = "loading";
let errorMessage: string | null = null;
let backendPreference: Backend = "webllm";

export function setBackendPreference(b: Backend): void {
  backendPreference = b;
  backendCache = null;
}

export function getBackendPreference(): Backend {
  return backendPreference;
}

export async function detectBackend(): Promise<Backend> {
  if (typeof navigator === "undefined") return "server";

  if (backendPreference === "webllm") {
    const gpu = navigator as unknown as { gpu?: { requestAdapter?: () => Promise<unknown> } };
    try {
      const adapter = await gpu.gpu?.requestAdapter?.();
      if (adapter) return "webllm";
    } catch {}
    return "server";
  }

  return backendPreference;
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

export function getEffectiveBackend(): Backend {
  return backendCache ?? backendPreference;
}

function isGpuError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return msg.includes("device was lost") || msg.includes("gpu") || msg.includes("webgpu");
}

export async function initModel(onProgress?: ProgressCallback): Promise<boolean> {
  if (engine) return true;

  state = "loading";
  errorMessage = null;

  const tryModel = async (modelId: string): Promise<boolean> => {
    try {
      engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          const progress = report.progress ?? 0;
          const text = report.text ?? "";
          onProgress?.(progress, text);
        },
      });
      state = "ready";
      return true;
    } catch (err) {
      if (isGpuError(err)) {
        return false;
      }
      throw err;
    }
  };

  if (await tryModel(MODEL_ID)) return true;
  if (await tryModel(FALLBACK_MODEL_ID)) return true;

  state = "unavailable";
  errorMessage = "WebGPU ran out of memory. WebLLM is unavailable.";
  return false;
}

export async function generateActions(
  prompt: string,
  systemPrompt?: string,
): Promise<DomActionType[]> {
  const backend = await getBackend();

  if (backend === "mock") {
    return generateMock(prompt);
  }

  if (backend === "server") {
    const config = loadServerConfig();
    return generateWithServer(prompt, systemPrompt ?? "", config);
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
