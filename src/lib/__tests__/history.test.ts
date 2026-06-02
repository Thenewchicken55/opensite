import { describe, it, expect, beforeEach } from "vitest";
import { takeSnapshot, restoreSnapshot } from "../history";

describe("takeSnapshot / restoreSnapshot", () => {
  let canvas: HTMLElement;

  beforeEach(() => {
    canvas = document.createElement("div");
    canvas.id = "canvas";
  });

  it("captures and restores DOM state", () => {
    canvas.innerHTML = "<div>original</div>";
    const snap = takeSnapshot(canvas);

    canvas.innerHTML = "<div>modified</div>";
    expect(canvas.innerHTML).toBe("<div>modified</div>");

    restoreSnapshot(canvas, snap);
    expect(canvas.innerHTML).toBe("<div>original</div>");
  });

  it("restores empty state", () => {
    canvas.innerHTML = "<div>content</div>";
    const snap = takeSnapshot(canvas);
    canvas.innerHTML = "";
    restoreSnapshot(canvas, snap);
    expect(canvas.innerHTML).toBe("<div>content</div>");
  });

  it("handles nested structures", () => {
    canvas.innerHTML = '<div id="a"><span id="b">deep</span></div>';
    const snap = takeSnapshot(canvas);
    canvas.innerHTML = "";
    restoreSnapshot(canvas, snap);
    expect(canvas.querySelector("#b")?.textContent).toBe("deep");
  });
});
