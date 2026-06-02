import { ActionList, type DomActionType } from "./schema";
import { executeAll } from "./interpreter";
import { generateActions, initModel, getBackend } from "./llm";
import { takeSnapshot, restoreSnapshot } from "./history";
import { serializeDom, formatDomSnapshot } from "./canvas-snapshot";
import type { ChatMessage } from "./server-llm";

function buildSystemPrompt(canvas: HTMLElement): string {
  const snapshot = serializeDom(canvas);
  const domContext = formatDomSnapshot(snapshot);

  return `You are a DOM agent that builds web pages by outputting JSON action arrays.

RESPOND WITH ONLY a JSON array of action objects. No other text.

AVAILABLE ACTIONS:

1. {"action":"clear"} — Remove everything inside #canvas to start fresh.

2. {"action":"setHTML","selector":"#canvas","content":"<h1>Title</h1><p>text</p>"} — Replace all content of #canvas with full HTML. Use this for rich pages (headings, paragraphs, images, links, layout). Content is raw HTML.

3. {"action":"create","tag":"img","attributes":{"src":"https://...","alt":"description","width":"300"}} — Create an element. For images, set src+alt in attributes. For text content use "content":"text" (plain text only, no HTML).

4. {"action":"style","selector":"#id","styles":{"background":"#f0f0f0","padding":"20px"}} — Apply CSS styles.

5. {"action":"insert","selector":"#id","position":"beforeend","content":"<p>HTML</p>"} — Insert raw HTML into an element.

6. {"action":"delete","selector":"#id"} — Remove element.
7. {"action":"update","selector":"#id","content":"new text","attributes":{"class":"new"}} — Update text and attributes.
8. {"action":"replace","selector":"#id","tag":"section","content":"text"} — Replace tag.
9. {"action":"move","selector":"#id","target":"#parent","position":"beforeend"} — Move element.
10. {"action":"setAttr","selector":"#id","name":"href","value":"https://..."}
11. {"action":"removeAttr","selector":"#id","name":"class"}
12. {"action":"addClass","selector":"#id","class":"active"}
13. {"action":"removeClass","selector":"#id","class":"active"}
14. {"action":"clone","selector":"#id","target":"#parent"}
15. {"action":"setText","selector":"#id","content":"plain text only"}

IMPORTANT GUIDELINES:
- Use "clear" as the first action to reset the canvas before building a new page.
- Use "setHTML" with selector "#canvas" to create rich content with full HTML.
- In "setHTML" content, use single quotes for HTML attributes (e.g., <div class='container'> not <div class="container">) to avoid breaking the JSON.
- For images, use {"action":"create","tag":"img","attributes":{"src":"URL","alt":"text","style":"width:100%;max-width:300px"}}.
- Be thorough and create complete, styled pages with multiple sections, headings, images, and proper layout.
- The root container is "#canvas". Use CSS selectors like "#canvas .card".
- Always respond with a JSON array, even if empty.

Current canvas DOM:
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
    emit({ type: "error", message: "Canvas not initialized" });
    return;
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
