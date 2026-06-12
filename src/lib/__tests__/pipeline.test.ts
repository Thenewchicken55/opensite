import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { setCanvas, processPrompt, subscribe, undo, redo, getUndoCount, getRedoCount } from "../pipeline";

const mockActions = vi.hoisted(() => [
  { action: "create" as const, tag: "div", attributes: { class: "test" } },
]);

vi.mock("../llm", () => ({
  generateActions: vi.fn().mockResolvedValue(mockActions),
  initModel: vi.fn().mockResolvedValue(true),
  getBackend: vi.fn().mockResolvedValue("mock"),
  detectBackend: vi.fn().mockResolvedValue("mock"),
  getEffectiveBackend: vi.fn().mockReturnValue("mock"),
  setBackendPreference: vi.fn(),
  getBackendPreference: vi.fn().mockReturnValue("mock"),
  unloadModel: vi.fn(),
  getState: vi.fn().mockReturnValue("ready"),
  getErrorMessage: vi.fn().mockReturnValue(null),
}));

vi.mock("../server-llm", () => ({
  loadServerConfig: vi.fn().mockReturnValue({
    baseUrl: "http://localhost:11434/v1",
    apiKey: "ollama",
    model: "llama3.2",
    temperature: 0.7,
  }),
  saveServerConfig: vi.fn(),
}));

vi.mock("../image-service", () => ({
  extractTopics: vi.fn().mockReturnValue([]),
  findImages: vi.fn().mockResolvedValue([]),
}));

describe("pipeline", () => {
  let canvas: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    canvas = document.createElement("div");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    setCanvas(canvas);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates elements from a mock prompt", async () => {
    const events: string[] = [];
    const unsub = subscribe((e) => events.push(e.type));

    await processPrompt("make a test element");

    expect(events).toContain("done");
    expect(canvas.children.length).toBeGreaterThan(0);
    expect(canvas.children[0].className).toBe("test");
    unsub();
  });

  it("emits error when canvas not found", async () => {
    canvas.remove();
    setCanvas(null as unknown as HTMLElement);

    const errors: string[] = [];
    const unsub = subscribe((e) => {
      if (e.type === "error") errors.push(e.message ?? "");
    });

    await processPrompt("anything");
    expect(errors.some((m) => m.includes("Canvas"))).toBe(true);
    unsub();
  });

  it("supports undo and redo", async () => {
    canvas.innerHTML = "<div>initial</div>";
    setCanvas(canvas);

    await processPrompt("add element");
    expect(getUndoCount()).toBeGreaterThan(0);

    const afterPrompt = canvas.innerHTML;
    undo(canvas);
    expect(canvas.innerHTML).toBe("<div>initial</div>");

    redo(canvas);
    expect(canvas.innerHTML).toBe(afterPrompt);
  });
});
