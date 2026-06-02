import { describe, it, expect } from "vitest";
import { serializeDom, formatDomSnapshot, type SerializedNode } from "../canvas-snapshot";

describe("serializeDom", () => {
  it("returns empty array for empty canvas", () => {
    const canvas = document.createElement("div");
    const result = serializeDom(canvas);
    expect(result).toEqual([]);
  });

  it("serializes a single element", () => {
    const canvas = document.createElement("div");
    canvas.innerHTML = '<p class="text" id="intro">Hello</p>';
    const result = serializeDom(canvas);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe("p");
    expect(result[0].id).toBe("intro");
    expect(result[0].class).toBe("text");
    expect(result[0].text).toBe("Hello");
  });

  it("serializes nested elements", () => {
    const canvas = document.createElement("div");
    canvas.innerHTML = '<div id="parent"><span id="child">nested</span></div>';
    const result = serializeDom(canvas);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].tag).toBe("span");
    expect(result[0].children[0].text).toBe("nested");
  });

  it("excludes script and style tags", () => {
    const canvas = document.createElement("div");
    canvas.innerHTML = '<div id="ok">fine</div><script>bad</script><style>.x{}</style>';
    const result = serializeDom(canvas);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ok");
  });

  it("omits text for elements with children", () => {
    const canvas = document.createElement("div");
    const parent = document.createElement("div");
    parent.textContent = "parent text";
    parent.appendChild(document.createElement("span"));
    canvas.appendChild(parent);
    const result = serializeDom(canvas);
    expect(result[0].text).toBeUndefined();
  });
});

describe("formatDomSnapshot", () => {
  it("returns empty message for empty array", () => {
    expect(formatDomSnapshot([])).toBe("The canvas is currently empty.");
  });

  it("formats a simple tree", () => {
    const nodes: SerializedNode[] = [
      { tag: "div", id: "root", children: [{ tag: "p", text: "hi", children: [] }] },
    ];
    const result = formatDomSnapshot(nodes);
    expect(result).toContain('<div id="root">');
    expect(result).toContain("<p>hi</p>");
    expect(result).toContain("</div>");
  });
});
