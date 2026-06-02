import { ActionList, type DomActionType } from "./schema";
import { executeAll } from "./interpreter";
import { generate, initModel } from "./llm";
import { takeSnapshot, restoreSnapshot } from "./history";

const SYSTEM_PROMPT = `You are a DOM agent. You control a web page by outputting structured JSON actions.

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

Rules:
- Use CSS selectors (e.g., "#canvas .card", "button.primary")
- The root container is "#canvas"
- Create elements inside "#canvas" unless a parent is specified
- Always use existing elements when updating or styling
- Respond ONLY with the JSON array`;

export interface PipelineEvent {
  type: "loading" | "generating" | "parsing" | "executing" | "done" | "error";
  message?: string;
  actions?: DomActionType[];
  errors?: string[];
}

type EventCallback = (event: PipelineEvent) => void;

let canvasElement: HTMLElement | null = null;
let undoStack: string[] = [];
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

export async function processPrompt(userInput: string): Promise<void> {
  if (!canvasElement) {
    emit({ type: "error", message: "Canvas not initialized" });
    return;
  }

  emit({ type: "loading", message: "Initializing model..." });
  try {
    await initModel();
  } catch {
    emit({ type: "error", message: "Failed to load model. Check WebGPU support." });
    return;
  }

  emit({ type: "generating", message: "Generating..." });
  let raw: string;
  try {
    raw = await generate(userInput, SYSTEM_PROMPT);
  } catch (err) {
    emit({ type: "error", message: `Generation failed: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }

  emit({ type: "parsing", message: "Parsing actions..." });
  let json: unknown;
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    json = JSON.parse(cleaned);
  } catch {
    emit({
      type: "error",
      message: "Model did not return valid JSON. Try rephrasing your prompt.",
    });
    return;
  }

  const result = ActionList.safeParse(json);
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

  const actions = result.data;

  emit({ type: "executing", message: `Executing ${actions.length} actions...`, actions });

  const snapshot = takeSnapshot(canvasElement);
  undoStack.push(snapshot);
  redoStack = [];

  const outcome = executeAll(actions, canvasElement);
  emit({
    type: "done",
    actions,
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
