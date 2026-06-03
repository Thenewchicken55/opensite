import { ActionList, type DomActionType } from "./schema";
import { executeAll } from "./interpreter";
import { generateActions, initModel, getBackend } from "./llm";
import { takeSnapshot, restoreSnapshot } from "./history";
import { serializeDom, formatDomSnapshot } from "./canvas-snapshot";
import type { ChatMessage } from "./server-llm";

function buildSystemPrompt(canvas: HTMLElement): string {
  const snapshot = serializeDom(canvas);
  const domContext = formatDomSnapshot(snapshot);

  return `You build web pages by outputting HTML inside a markdown code block.

OUTPUT FORMAT — put your HTML in a html code block:
\`\`\`html
<h1>Page Title</h1>
<p>Content here...</p>
<img src='https://example.com/image.jpg' alt='description'>
\`\`\`

RULES:
- Output the COMPLETE page HTML every time, not just changes. The entire canvas will be replaced with your HTML.
- Use single quotes for HTML attributes (class='container' not class="container") to prevent issues.
- For images, use <img src='URL' alt='description' style='max-width:100%'>
- For links, use <a href='URL'>text</a>
- Add inline styles for layout: style='padding:20px;background:#f0f0f0'
- Be thorough — create full, styled pages with headings, paragraphs, images, sections, and proper hierarchy.
- The canvas has no default styles, so add your own inline styles or <style> tags.

If you prefer, you can also use JSON actions for precise surgical changes:
\`\`\`json
[{"action":"clear"},{"action":"create","tag":"button","attributes":{"id":"btn1"},"content":"Click"}]
\`\`\`

Current canvas HTML:
${domContext}`;
}

export interface PipelineEvent {
  type: "loading" | "generating" | "parsing" | "executing" | "done" | "error";
  message?: string;
  actions?: DomActionType[];
  errors?: string[];
}

type EventCallback = (event: PipelineEvent) => void;

let canvasElement: HTMLElement | null = null;
const undoStack: string[] = [];
let redoStack: string[] = [];
let subscribers: EventCallback[] = [];
let isProcessing = false;
let pendingPrompt: (() => void) | null = null;

export function setCanvas(el: HTMLElement): void {
  canvasElement = el;
}

export function subscribe(cb: EventCallback): () => void {
  subscribers.push(cb);
  return () => {
    subscribers = subscribers.filter((s) => s !== cb);
  };
}

function emit(event: PipelineEvent): void {
  subscribers.forEach((cb) => cb(event));
}

export async function processPrompt(
  userInput: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<void> {
  if (isProcessing) {
    emit({ type: "error", message: "Already processing a prompt. Please wait." });
    return;
  }
  if (!canvasElement) {
    const found = document.querySelector<HTMLElement>("#canvas");
    if (found) {
      canvasElement = found;
    } else {
      emit({ type: "error", message: "Canvas not initialized" });
      return;
    }
  }

  isProcessing = true;
  const done = () => { isProcessing = false; };

  try {
    const backend = await getBackend();

    if (backend === "webllm") {
      emit({ type: "loading", message: "Loading model..." });
      const loaded = await initModel();
      if (!loaded) {
        emit({
          type: "error",
          message:
            "WebLLM failed to load (WebGPU unavailable). Go to Settings and switch to a remote server backend.",
        });
        return;
      }
    }

    emit({ type: "generating", message: "Generating..." });

    const systemPrompt = buildSystemPrompt(canvasElement);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userInput },
    ];

    let actions: DomActionType[];
    try {
      actions = await generateActions(messages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      emit({ type: "error", message: `Generation failed: ${msg}` });
      return;
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      emit({ type: "done", actions: [] });
      return;
    }

    const result = ActionList.safeParse(actions);
    if (!result.success) {
      const msg = result.error.issues
        .slice(0, 2)
        .map((i) => i.message)
        .join("; ");
      emit({
        type: "error",
        message: `Invalid action structure: ${msg}`,
      });
      return;
    }

    const validated = result.data;

    emit({ type: "executing", message: `Executing ${validated.length} actions...`, actions: validated });

    const snapshot = takeSnapshot(canvasElement);
    undoStack.push(snapshot);
    redoStack = [];

    const outcome = executeAll(validated, canvasElement);
    emit({
      type: "done",
      actions: validated,
      errors: outcome.errors.length > 0 ? outcome.errors : undefined,
    });
  } finally {
    done();
  }
}

export function undo(canvas: HTMLElement): void {
  if (undoStack.length === 0) return;
  const current = takeSnapshot(canvas);
  redoStack.push(current);
  const prev = undoStack.pop()!;
  restoreSnapshot(canvas, prev);
}

export function redo(canvas: HTMLElement): void {
  if (redoStack.length === 0) return;
  const current = takeSnapshot(canvas);
  undoStack.push(current);
  const next = redoStack.pop()!;
  restoreSnapshot(canvas, next);
}

export function getUndoCount(): number {
  return undoStack.length;
}

export function getRedoCount(): number {
  return redoStack.length;
}
