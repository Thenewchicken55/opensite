import { describe, it, expect } from "vitest";
import {
  CreateAction,
  UpdateAction,
  DeleteAction,
  StyleAction,
  InsertAction,
  ReplaceAction,
  MoveAction,
  CloneAction,
  SetAttrAction,
  RemoveAttrAction,
  AddClassAction,
  RemoveClassAction,
  SetTextAction,
  SetHTMLAction,
  DomAction,
  ActionList,
  MAX_ACTIONS,
} from "../schema";

describe("CreateAction", () => {
  it("validates a minimal create action", () => {
    const result = CreateAction.safeParse({ action: "create", tag: "div" });
    expect(result.success).toBe(true);
  });

  it("validates a create with all fields", () => {
    const result = CreateAction.safeParse({
      action: "create",
      tag: "button",
      parent: "#container",
      content: "Click me",
      attributes: { class: "btn", id: "mybtn" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects create without tag", () => {
    const result = CreateAction.safeParse({ action: "create" });
    expect(result.success).toBe(false);
  });

  it("rejects create with wrong action literal", () => {
    const result = CreateAction.safeParse({ action: "delete", tag: "div" });
    expect(result.success).toBe(false);
  });
});

describe("UpdateAction", () => {
  it("validates an update action", () => {
    const result = UpdateAction.safeParse({
      action: "update",
      selector: "#myid",
      content: "new text",
      attributes: { class: "updated" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects update without selector", () => {
    const result = UpdateAction.safeParse({ action: "update", content: "text" });
    expect(result.success).toBe(false);
  });
});

describe("DeleteAction", () => {
  it("validates a delete action", () => {
    const result = DeleteAction.safeParse({ action: "delete", selector: ".remove" });
    expect(result.success).toBe(true);
  });

  it("rejects delete without selector", () => {
    const result = DeleteAction.safeParse({ action: "delete" });
    expect(result.success).toBe(false);
  });
});

describe("StyleAction", () => {
  it("validates a style action", () => {
    const result = StyleAction.safeParse({
      action: "style",
      selector: "#box",
      styles: { background: "red", color: "white" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects style without styles", () => {
    const result = StyleAction.safeParse({ action: "style", selector: "#box" });
    expect(result.success).toBe(false);
  });
});

describe("InsertAction", () => {
  it("validates an insert action", () => {
    const result = InsertAction.safeParse({
      action: "insert",
      selector: "#container",
      position: "beforeend",
      content: "<p>hello</p>",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid position", () => {
    const result = InsertAction.safeParse({
      action: "insert",
      selector: "#container",
      position: "sideways",
      content: "<p>hello</p>",
    });
    expect(result.success).toBe(false);
  });
});

describe("ReplaceAction", () => {
  it("validates a replace action", () => {
    const result = ReplaceAction.safeParse({
      action: "replace",
      selector: "#old",
      tag: "button",
      content: "new",
    });
    expect(result.success).toBe(true);
  });
});

describe("MoveAction", () => {
  it("validates a move action", () => {
    const result = MoveAction.safeParse({
      action: "move",
      selector: "#el",
      target: "#parent",
      position: "beforeend",
    });
    expect(result.success).toBe(true);
  });
});

describe("CloneAction", () => {
  it("validates a clone action", () => {
    const result = CloneAction.safeParse({
      action: "clone",
      selector: "#item",
      target: "#list",
      position: "beforeend",
    });
    expect(result.success).toBe(true);
  });
});

describe("SetAttrAction", () => {
  it("validates setAttr", () => {
    const result = SetAttrAction.safeParse({
      action: "setAttr",
      selector: "#el",
      name: "data-value",
      value: "123",
    });
    expect(result.success).toBe(true);
  });
});

describe("RemoveAttrAction", () => {
  it("validates removeAttr", () => {
    const result = RemoveAttrAction.safeParse({
      action: "removeAttr",
      selector: "#el",
      name: "data-value",
    });
    expect(result.success).toBe(true);
  });
});

describe("AddClassAction / RemoveClassAction", () => {
  it("validates addClass", () => {
    const result = AddClassAction.safeParse({ action: "addClass", selector: "#el", class: "active" });
    expect(result.success).toBe(true);
  });

  it("validates removeClass", () => {
    const result = RemoveClassAction.safeParse({ action: "removeClass", selector: "#el", class: "active" });
    expect(result.success).toBe(true);
  });
});

describe("SetTextAction", () => {
  it("validates setText", () => {
    const result = SetTextAction.safeParse({
      action: "setText",
      selector: "#el",
      content: "hello",
    });
    expect(result.success).toBe(true);
  });
});

describe("SetHTMLAction", () => {
  it("validates setHTML", () => {
    const result = SetHTMLAction.safeParse({
      action: "setHTML",
      selector: "#el",
      content: "<p>hello</p>",
    });
    expect(result.success).toBe(true);
  });
});

describe("DomAction discriminated union", () => {
  it("parses a create action through the union", () => {
    const result = DomAction.safeParse({ action: "create", tag: "div" });
    expect(result.success).toBe(true);
  });

  it("parses a delete action through the union", () => {
    const result = DomAction.safeParse({ action: "delete", selector: ".x" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown action type", () => {
    const result = DomAction.safeParse({ action: "fly", selector: ".x" });
    expect(result.success).toBe(false);
  });
});

describe("ActionList", () => {
  it("validates an array of actions", () => {
    const result = ActionList.safeParse([
      { action: "delete", selector: ".old" },
      { action: "create", tag: "div", attributes: { class: "new" } },
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it("rejects empty array", () => {
    const result = ActionList.safeParse([]);
    expect(result.success).toBe(false);
  });

  it("rejects array exceeding MAX_ACTIONS", () => {
    const actions = Array.from({ length: MAX_ACTIONS + 1 }, (_, i) => ({
      action: "create" as const,
      tag: "div",
      attributes: { id: `el${i}` },
    }));
    const result = ActionList.safeParse(actions);
    expect(result.success).toBe(false);
  });

  it("accepts array at MAX_ACTIONS limit", () => {
    const actions = Array.from({ length: MAX_ACTIONS }, (_, i) => ({
      action: "create" as const,
      tag: "div",
      attributes: { id: `el${i}` },
    }));
    const result = ActionList.safeParse(actions);
    expect(result.success).toBe(true);
  });
});
