import { ActionList, type DomActionType } from "./schema";
import { executeAll } from "./interpreter";
import { generateActions, initModel, getBackend } from "./llm";
import { takeSnapshot, restoreSnapshot } from "./history";
import { serializeDom, formatDomSnapshot } from "./canvas-snapshot";
import type { ChatMessage } from "./server-llm";

function buildSystemPrompt(canvas: HTMLElement): string {
  const snapshot = serializeDom(canvas);
  const domContext = formatDomSnapshot(snapshot);

  return `You are a DOM agent. You control a web page by outputting structured JSON actions.

You MUST respond with ONLY a JSON array of action objects. No prose, no markdown, no explanation.

Available actions:
- {"action":"create","tag":"div","parent":"#selector","content":"text","attributes":{"id":"myid"}}
- {"action":"update","selector":"#id","content":"new text","attributes":{"class":"new"}}
- {"action":"delete","selector":"#id"}
- {"action":"style","selector":"#id","styles":{"background":"red","color":"white"}}
- {"action":"insert","selector":"#id","position":"beforeend","content":"<p>HTML</p>"}
- {"action":"replace","selector":"#id","tag":"button","content":"Click"}
- {"action":"move","selector":"#id","target":"#parent","position":"beforeend"}
- {"action":"setAttr","selector":"#id","name":"data-value","value":"123"}
- {"action":"removeAttr","selector":"#id","name":"data-value"}
- {"action":"addClass","selector":"#id","class":"active"}
- {"action":"removeClass","selector":"#id","class":"active"}

Additional actions:
- {"action":"clone","selector":"#id","target":"#parent","position":"beforeend"}
- {"action":"setText","selector":"#id","content":"new text"}
- {"action":"setHTML","selector":"#id","content":"<p>HTML</p>"}

Rules:
- Use CSS selectors (e.g., "#canvas .card", "button.primary")
- The root container is "#canvas"
- Create elements inside "#canvas" unless a parent is specified
- Always use existing elements when updating or styling
- Never wrap the JSON in markdown code blocks
- Respond ONLY with the JSON array

Current DOM state inside #canvas:
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
  if (!canvasElement) {
    emit({ type: "error", message: "Canvas not initialized" });
    return;
  }

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

  const result = ActionList.safeParse(actions);
  if (!result.success) {
    emit({
      type: "error",
      message: `Invalid action structure: ${result.error.issues
        .slice(0, 3)
        .map((i) => i.message)
        .join("; ")}`,
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
