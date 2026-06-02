export interface SerializedNode {
  tag: string;
  id?: string;
  class?: string;
  text?: string;
  children: SerializedNode[];
}

const EXCLUDED_TAGS = new Set(["script", "style", "link", "meta"]);

function serializeElement(el: Element): SerializedNode {
  const node: SerializedNode = {
    tag: el.tagName.toLowerCase(),
    children: [],
  };

  const id = el.getAttribute("id");
  if (id) node.id = id;

  const cls = el.getAttribute("class");
  if (cls) node.class = cls;

  if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) {
    const text = el.firstChild.textContent?.trim();
    if (text) node.text = text;
  }

  for (const child of el.children) {
    if (!EXCLUDED_TAGS.has(child.tagName.toLowerCase())) {
      node.children.push(serializeElement(child));
    }
  }

  return node;
}

export function serializeDom(canvas: HTMLElement): SerializedNode[] {
  const nodes: SerializedNode[] = [];
  for (const child of canvas.children) {
    nodes.push(serializeElement(child));
  }
  return nodes;
}

export function formatDomSnapshot(nodes: SerializedNode[]): string {
  if (nodes.length === 0) return "The canvas is currently empty.";

  function formatNode(node: SerializedNode, depth: number): string {
    const indent = "  ".repeat(depth);
    let line = `${indent}<${node.tag}`;
    if (node.id) line += ` id="${node.id}"`;
    if (node.class) line += ` class="${node.class}"`;
    line += ">";
    if (node.text) line += node.text;
    if (node.children.length > 0) {
      for (const child of node.children) {
        line += `\n${formatNode(child, depth + 1)}`;
      }
      line += `\n${indent}</${node.tag}>`;
    } else {
      line += `</${node.tag}>`;
    }
    return line;
  }

  return nodes.map((n) => formatNode(n, 0)).join("\n");
}
