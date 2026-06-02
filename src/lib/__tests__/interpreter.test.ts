import { describe, it, expect, beforeEach } from "vitest";
import { executeAction, executeAll } from "../interpreter";
import type { DomActionType } from "../schema";

function createCanvas(): HTMLElement {
  const canvas = document.createElement("div");
  canvas.id = "canvas";
  document.body.appendChild(canvas);
  return canvas;
}

describe("executeAction", () => {
  let canvas: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    canvas = createCanvas();
  });

  describe("create", () => {
    it("creates an element inside canvas", () => {
      const action: DomActionType = { action: "create", tag: "div" };
      const err = executeAction(action, canvas);
      expect(err).toBeNull();
      expect(canvas.children.length).toBe(1);
      expect(canvas.children[0].tagName).toBe("DIV");
    });

    it("creates with text content", () => {
      const action: DomActionType = { action: "create", tag: "p", content: "Hello" };
      executeAction(action, canvas);
      expect(canvas.children[0].textContent).toBe("Hello");
    });

    it("creates with attributes", () => {
      const action: DomActionType = {
        action: "create",
        tag: "button",
        attributes: { class: "btn", id: "mybtn" },
      };
      executeAction(action, canvas);
      const el = canvas.children[0] as HTMLElement;
      expect(el.className).toBe("btn");
      expect(el.id).toBe("mybtn");
    });

    it("rejects forbidden tags", () => {
      const action: DomActionType = { action: "create", tag: "script" };
      const err = executeAction(action, canvas);
      expect(err).toContain("Cannot create");
    });

    it("detects duplicate IDs", () => {
      const existing = document.createElement("div");
      existing.id = "dup";
      canvas.appendChild(existing);

      const action: DomActionType = {
        action: "create",
        tag: "div",
        attributes: { id: "dup" },
      };
      const err = executeAction(action, canvas);
      expect(err).toContain("Duplicate ID");
    });
  });

  describe("update", () => {
    it("updates text content", () => {
      canvas.innerHTML = '<div id="target">Old</div>';
      const action: DomActionType = { action: "update", selector: "#target", content: "New" };
      const err = executeAction(action, canvas);
      expect(err).toBeNull();
      expect(canvas.querySelector("#target")?.textContent).toBe("New");
    });

    it("returns error for missing selector", () => {
      const action: DomActionType = { action: "update", selector: "#nonexistent", content: "x" };
      const err = executeAction(action, canvas);
      expect(err).toContain("not found");
    });
  });

  describe("delete", () => {
    it("deletes an element", () => {
      canvas.innerHTML = '<div class="remove-me">x</div>';
      expect(canvas.children.length).toBe(1);
      const action: DomActionType = { action: "delete", selector: ".remove-me" };
      const err = executeAction(action, canvas);
      expect(err).toBeNull();
      expect(canvas.children.length).toBe(0);
    });

    it("prevents deleting canvas itself", () => {
      const action: DomActionType = { action: "delete", selector: "#canvas" };
      const err = executeAction(action, canvas);
      expect(err).toContain("Cannot delete");
    });
  });

  describe("style", () => {
    it("applies styles", () => {
      canvas.innerHTML = '<div id="box">x</div>';
      const action: DomActionType = {
        action: "style",
        selector: "#box",
        styles: { background: "red", color: "white" },
      };
      executeAction(action, canvas);
      const el = canvas.querySelector("#box") as HTMLElement;
      expect(el.style.background).toBe("red");
      expect(el.style.color).toBe("white");
    });
  });

  describe("insert", () => {
    it("inserts HTML", () => {
      canvas.innerHTML = '<div id="container"></div>';
      const action: DomActionType = {
        action: "insert",
        selector: "#container",
        position: "beforeend",
        content: "<span>hi</span>",
      };
      executeAction(action, canvas);
      const container = canvas.querySelector("#container")!;
      expect(container.children.length).toBe(1);
      expect(container.children[0].tagName).toBe("SPAN");
    });

    it("rejects script insertion", () => {
      canvas.innerHTML = '<div id="c"></div>';
      const action: DomActionType = {
        action: "insert",
        selector: "#c",
        position: "beforeend",
        content: "<script>alert(1)</script>",
      };
      const err = executeAction(action, canvas);
      expect(err).toContain("Cannot insert script");
    });
  });

  describe("replace", () => {
    it("replaces an element", () => {
      canvas.innerHTML = '<span id="old">text</span>';
      const action: DomActionType = {
        action: "replace",
        selector: "#old",
        tag: "div",
        content: "replaced",
      };
      executeAction(action, canvas);
      expect(canvas.querySelector("#old")).toBeNull();
      expect(canvas.children[0].tagName).toBe("DIV");
      expect(canvas.children[0].textContent).toBe("replaced");
    });
  });

  describe("move", () => {
    it("moves an element to a target", () => {
      canvas.innerHTML = '<div id="source">x</div><div id="dest"></div>';
      const action: DomActionType = {
        action: "move",
        selector: "#source",
        target: "#dest",
        position: "beforeend",
      };
      executeAction(action, canvas);
      const dest = canvas.querySelector("#dest")!;
      expect(dest.children.length).toBe(1);
      expect(dest.children[0].id).toBe("source");
    });
  });

  describe("clone", () => {
    it("clones an element", () => {
      canvas.innerHTML = '<div id="orig">content</div>';
      const action: DomActionType = { action: "clone", selector: "#orig" };
      executeAction(action, canvas);
      expect(canvas.children.length).toBe(2);
      expect(canvas.children[1].textContent).toBe("content");
    });
  });

  describe("setAttr", () => {
    it("sets an attribute", () => {
      canvas.innerHTML = '<div id="el">x</div>';
      const action: DomActionType = {
        action: "setAttr",
        selector: "#el",
        name: "data-foo",
        value: "bar",
      };
      executeAction(action, canvas);
      expect(canvas.querySelector("#el")?.getAttribute("data-foo")).toBe("bar");
    });
  });

  describe("removeAttr", () => {
    it("removes an attribute", () => {
      canvas.innerHTML = '<div id="el" data-foo="bar">x</div>';
      const action: DomActionType = {
        action: "removeAttr",
        selector: "#el",
        name: "data-foo",
      };
      executeAction(action, canvas);
      expect(canvas.querySelector("#el")?.getAttribute("data-foo")).toBeNull();
    });
  });

  describe("addClass / removeClass", () => {
    it("adds a class", () => {
      canvas.innerHTML = '<div id="el">x</div>';
      executeAction({ action: "addClass", selector: "#el", class: "active" }, canvas);
      expect(canvas.querySelector("#el")?.classList.contains("active")).toBe(true);
    });

    it("removes a class", () => {
      canvas.innerHTML = '<div id="el" class="active">x</div>';
      executeAction({ action: "removeClass", selector: "#el", class: "active" }, canvas);
      expect(canvas.querySelector("#el")?.classList.contains("active")).toBe(false);
    });
  });

  describe("setText", () => {
    it("sets text content", () => {
      canvas.innerHTML = '<div id="el">old</div>';
      executeAction({ action: "setText", selector: "#el", content: "new" }, canvas);
      expect(canvas.querySelector("#el")?.textContent).toBe("new");
    });
  });

  describe("setHTML", () => {
    it("sets innerHTML", () => {
      canvas.innerHTML = '<div id="el"></div>';
      executeAction({ action: "setHTML", selector: "#el", content: "<span>inner</span>" }, canvas);
      expect(canvas.querySelector("#el")?.children.length).toBe(1);
    });

    it("rejects script tags", () => {
      canvas.innerHTML = '<div id="el"></div>';
      const err = executeAction(
        { action: "setHTML", selector: "#el", content: "<script>bad</script>" },
        canvas,
      );
      expect(err).toContain("Cannot insert script");
    });
  });
});

describe("executeAll", () => {
  it("executes multiple actions and collects errors", () => {
    const canvas = createCanvas();
    const actions: DomActionType[] = [
      { action: "create", tag: "div", attributes: { id: "a" } },
      { action: "create", tag: "div", attributes: { id: "b" } },
      { action: "update", selector: "#nonexistent", content: "x" },
    ];
    const result = executeAll(actions, canvas);
    expect(canvas.children.length).toBe(2);
    expect(result.errors.length).toBe(1);
    expect(result.success).toBe(false);
  });
});
