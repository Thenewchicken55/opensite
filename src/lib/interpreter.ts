import type { DomActionType } from "./schema";

const FORBIDDEN_TAGS = new Set(["script", "html", "head", "body", "iframe", "object", "embed"]);
const FORBIDDEN_SELECTORS = ["html", "head", "body", "document", "window"];

function isSelectorForbidden(selector: string): boolean {
  const clean = selector.replace(/[>+~\s].*$/, "").trim();
  return FORBIDDEN_SELECTORS.some((s) => clean === s || clean === s.toLowerCase());
}

function resolveParent(action: DomActionType, canvas: HTMLElement): HTMLElement {
  if (action.action === "create" && action.parent) {
    const el = document.querySelector(action.parent);
    return (el instanceof HTMLElement) ? el : canvas;
  }
  return canvas;
}

export function executeAction(action: DomActionType, canvas: HTMLElement): string | null {
  try {
    switch (action.action) {
      case "create": {
        const tag = action.tag.toLowerCase();
        if (FORBIDDEN_TAGS.has(tag)) return `Cannot create <${tag}> elements`;
        if (action.attributes?.id && document.getElementById(action.attributes.id)) {
          return `Duplicate ID: "${action.attributes.id}" already exists`;
        }
        const el = document.createElement(tag);
        if (action.content) el.textContent = action.content;
        if (action.attributes) {
          const attrs = action.attributes as Record<string, string>;
          for (const [key, val] of Object.entries(attrs)) {
            if (key === "id" || key === "class" || key.startsWith("data-")) {
              el.setAttribute(key, val);
            }
          }
        }
        const parent = resolveParent(action, canvas);
        parent.appendChild(el);
        return null;
      }

      case "update": {
        if (isSelectorForbidden(action.selector)) return "Cannot update protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (action.content !== undefined) el.textContent = action.content;
        if (action.attributes) {
          const attrs = action.attributes as Record<string, string>;
          for (const [key, val] of Object.entries(attrs)) {
            if (el instanceof HTMLElement) el.setAttribute(key, val);
          }
        }
        return null;
      }

      case "delete": {
        if (isSelectorForbidden(action.selector)) return "Cannot delete protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (el === canvas || el === document.body || el === document.documentElement) {
          return "Cannot delete root elements";
        }
        el.remove();
        return null;
      }

      case "style": {
        if (isSelectorForbidden(action.selector)) return "Cannot style protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (!(el instanceof HTMLElement)) return "Cannot style non-HTMLElement";
        Object.assign(el.style, action.styles);
        return null;
      }

      case "insert": {
        if (isSelectorForbidden(action.selector)) return "Cannot insert into protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (action.content.toLowerCase().includes("<script")) return "Cannot insert script tags";
        el.insertAdjacentHTML(action.position, action.content);
        return null;
      }

      case "replace": {
        if (isSelectorForbidden(action.selector)) return "Cannot replace protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (el === canvas || el === document.body || el === document.documentElement) {
          return "Cannot replace root elements";
        }
        const tag = action.tag.toLowerCase();
        if (FORBIDDEN_TAGS.has(tag)) return `Cannot create <${tag}> elements`;
        const replacement = document.createElement(tag);
        if (action.content) replacement.textContent = action.content;
        if (action.attributes) {
          const attrs = action.attributes as Record<string, string>;
          for (const [key, val] of Object.entries(attrs)) {
            replacement.setAttribute(key, val);
          }
        }
        el.parentNode?.replaceChild(replacement, el);
        return null;
      }

      case "move": {
        if (isSelectorForbidden(action.selector)) return "Cannot move protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (el === canvas || el === document.body || el === document.documentElement) {
          return "Cannot move root elements";
        }
        const target = document.querySelector(action.target);
        if (!target) return `Target not found: ${action.target}`;
        target.insertAdjacentElement(action.position ?? "beforeend", el);
        return null;
      }

      case "setAttr": {
        if (isSelectorForbidden(action.selector)) return "Cannot modify protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        el.setAttribute(action.name, action.value);
        return null;
      }

      case "removeAttr": {
        if (isSelectorForbidden(action.selector)) return "Cannot modify protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        el.removeAttribute(action.name);
        return null;
      }

      case "addClass": {
        if (isSelectorForbidden(action.selector)) return "Cannot modify protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (el instanceof HTMLElement) el.classList.add(action.class);
        return null;
      }

      case "removeClass": {
        if (isSelectorForbidden(action.selector)) return "Cannot modify protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (el instanceof HTMLElement) el.classList.remove(action.class);
        return null;
      }

      case "clone": {
        if (isSelectorForbidden(action.selector)) return "Cannot clone protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (el === canvas || el === document.body || el === document.documentElement) {
          return "Cannot clone root elements";
        }
        const clone = el.cloneNode(true) as HTMLElement;
        if (clone.id) clone.id = `${clone.id}-copy`;
        if (action.target) {
          const target = document.querySelector(action.target);
          if (!target) return `Target not found: ${action.target}`;
          target.insertAdjacentElement(action.position ?? "beforeend", clone);
        } else {
          el.parentNode?.insertBefore(clone, el.nextSibling);
        }
        return null;
      }

      case "setText": {
        if (isSelectorForbidden(action.selector)) return "Cannot modify protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        el.textContent = action.content;
        return null;
      }

      case "setHTML": {
        if (isSelectorForbidden(action.selector)) return "Cannot modify protected element";
        const el = document.querySelector(action.selector);
        if (!el) return `Element not found: ${action.selector}`;
        if (action.content.toLowerCase().includes("<script")) return "Cannot insert script tags";
        el.innerHTML = action.content;
        return null;
      }
    }
  } catch (err) {
    return `Error executing ${action.action}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export interface ActionResult {
  success: boolean;
  errors: string[];
}

export function executeAll(actions: DomActionType[], canvas: HTMLElement): ActionResult {
  const errors: string[] = [];
  for (const action of actions) {
    const error = executeAction(action, canvas);
    if (error) errors.push(error);
  }
  return { success: errors.length === 0, errors };
}
