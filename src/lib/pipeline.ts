import { ActionList, type DomActionType } from "./schema";
import { executeAll } from "./interpreter";
import { generateActions, initModel, getBackend } from "./llm";
import { takeSnapshot, restoreSnapshot } from "./history";
import { serializeDom, formatDomSnapshot } from "./canvas-snapshot";
import { extractTopics, findImages } from "./image-service";
import type { ChatMessage } from "./server-llm";

async function buildSystemPrompt(canvas: HTMLElement, userInput: string): Promise<string> {
  const snapshot = serializeDom(canvas);
  const domContext = formatDomSnapshot(snapshot);

  const topics = extractTopics(userInput);
  const imageResults = [];
  for (const topic of topics) {
    const images = await findImages(topic);
    imageResults.push(...images);
  }

  const imageHints = imageResults.length > 0
    ? `\nImages found for this topic (you can use these URLs in <img> tags):\n${imageResults.map((img) => `  <img src='${img.url}' alt='${img.alt}'>`).join("\n")}`
    : "";

  return `You build web pages by outputting HTML inside a markdown code block.

OUTPUT FORMAT — put your HTML in a html code block:
\`\`\`html
<h1>Page Title</h1>
<p>Content here...</p>
\`\`\`

RULES:
- Output the COMPLETE page HTML every time, not just changes.
- Use single quotes for HTML attributes (class='container' not class="container").
- The canvas has no default styles — add your own with inline styles or <style> tags.
- Do NOT use <style> tags — they affect the entire page, not just the canvas. Use inline styles instead: style='color:red;font-size:18px'.
- Do NOT use <link>, <base>, or <meta> tags.

IMAGES:
- For icons, logos, diagrams, characters: use inline SVG inside your HTML. SVGs render immediately and always work. Example:
  \`\`\`html
  <svg width='40' height='40' viewBox='0 0 40 40'>
    <circle cx='20' cy='20' r='18' fill='#4a90d9'/>
    <text x='20' y='26' text-anchor='middle' fill='white' font-size='18' font-weight='bold'>A</text>
  </svg>
  \`\`\`
- For photos and real-world images, use <img src='URL' alt='text' style='max-width:100%'> with real image URLs.
- SVG is better than external images because it always loads (it's embedded in the page).
- Create decorative elements like dividers, icons, avatars, and illustrations using SVG.

${imageHints}

If you need fine-grained changes, you can also use JSON actions:
\`\`\`json
[{"action":"clear"},{"action":"create","tag":"button","content":"Click"}]
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

    const systemPrompt = await buildSystemPrompt(canvasElement, userInput);
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
