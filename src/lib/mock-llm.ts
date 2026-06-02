import type { DomActionType } from "./schema";

function parsePrompt(prompt: string): DomActionType[] {
  const lower = prompt.toLowerCase();

  const colorKeywords: Record<string, string> = {
    red: "#ef4444", blue: "#3b82f6", green: "#22c55e",
    yellow: "#eab308", purple: "#a855f7", pink: "#ec4899",
    orange: "#f97316", teal: "#14b8a6", cyan: "#06b6d4",
    white: "#ffffff", black: "#000000", gray: "#6b7280",
  };

  const color = Object.keys(colorKeywords).find((c) => lower.includes(c));
  const bgColor = color ? colorKeywords[color] : undefined;

  const steps: Array<{ keywords: string[]; build: () => DomActionType[] }> = [
    {
      keywords: ["login", "form", "sign in", "sign up", "register"],
      build: () => [
        { action: "create", tag: "div", attributes: { class: "max-w-md mx-auto mt-12 p-6 rounded-xl border border-[#1f1f2e] bg-[#12121a]" } },
        { action: "create", tag: "h2", parent: "div:first-child", content: "Login", attributes: { class: "text-2xl font-bold text-[#e4e4ed] mb-6" } },
        { action: "create", tag: "input", parent: "div:first-child", attributes: { class: "w-full px-3 py-2 rounded-lg border border-[#1f1f2e] bg-[#1a1a28] text-[#e4e4ed] mb-3", placeholder: "Email" } },
        { action: "create", tag: "input", parent: "div:first-child", attributes: { class: "w-full px-3 py-2 rounded-lg border border-[#1f1f2e] bg-[#1a1a28] text-[#e4e4ed] mb-4", placeholder: "Password", type: "password" } },
        { action: "create", tag: "button", parent: "div:first-child", content: "Sign In", attributes: { class: "w-full px-4 py-2 rounded-lg bg-[#6366f1] text-white font-medium hover:bg-[#818cf8] cursor-pointer" } },
      ],
    },
    {
      keywords: ["button", "click"],
      build: () => {
        const btnText = prompt.match(/button\s+(?:that\s+)?says?\s+["']?([^"'\n]+)/i)?.[1] ?? "Click Me";
        return [
          { action: "create", tag: "button", content: btnText, attributes: { class: `px-4 py-2 rounded-lg font-medium text-white cursor-pointer ${bgColor ? "" : "bg-[#6366f1] hover:bg-[#818cf8]"}` } },
        ];
      },
    },
    {
      keywords: ["heading", "header", "title", "h1"],
      build: () => [
        { action: "create", tag: "h1", content: prompt.replace(/(create|add|make|put)\s*(a|an)?\s*(heading|header|title)\s*/i, "").trim() || "Heading", attributes: { class: "text-3xl font-bold text-[#e4e4ed]" } },
      ],
    },
    {
      keywords: ["card"],
      build: () => [
        { action: "create", tag: "div", attributes: { class: "max-w-sm p-6 rounded-xl border border-[#1f1f2e] bg-[#12121a]" } },
        { action: "create", tag: "h3", parent: "div:first-child", content: "Card Title", attributes: { class: "text-lg font-semibold text-[#e4e4ed] mb-2" } },
        { action: "create", tag: "p", parent: "div:first-child", content: "This is a card with some content.", attributes: { class: "text-[#8888a0] text-sm" } },
      ],
    },
    {
      keywords: ["list", "ul", "ol", "items"],
      build: () => {
        const items = prompt.match(/item[:\s]+([^,\n]+)/gi) ?? [];
        const listItems = items.length > 0 ? items.map((i) => i.replace(/item[:\s]+/i, "").trim()) : ["Item 1", "Item 2", "Item 3"];
        const result: DomActionType[] = [
          { action: "create", tag: "ul", attributes: { class: "list-disc pl-5 text-[#e4e4ed] space-y-1" } },
        ];
        for (const item of listItems) {
          result.push({ action: "create", tag: "li", parent: "ul:first-child", content: item, attributes: { class: "text-[#8888a0]" } });
        }
        return result;
      },
    },
    {
      keywords: ["navbar", "nav", "navigation", "menu"],
      build: () => [
        { action: "create", tag: "nav", attributes: { class: "flex items-center gap-6 p-4 border-b border-[#1f1f2e] bg-[#12121a]" } },
        { action: "create", tag: "span", parent: "nav:first-child", content: "Logo", attributes: { class: "font-bold text-[#e4e4ed]" } },
        { action: "create", tag: "a", parent: "nav:first-child", content: "Home", attributes: { class: "text-[#8888a0] hover:text-[#e4e4ed] text-sm cursor-pointer" } },
        { action: "create", tag: "a", parent: "nav:first-child", content: "About", attributes: { class: "text-[#8888a0] hover:text-[#e4e4ed] text-sm cursor-pointer" } },
        { action: "create", tag: "a", parent: "nav:first-child", content: "Contact", attributes: { class: "text-[#8888a0] hover:text-[#e4e4ed] text-sm cursor-pointer" } },
      ],
    },
    {
      keywords: ["table"],
      build: () => [
        { action: "create", tag: "table", attributes: { class: "w-full border-collapse" } },
        { action: "create", tag: "tr", parent: "table:first-child", attributes: { class: "border-b border-[#1f1f2e]" } },
        { action: "create", tag: "th", parent: "tr:first-child", content: "Name", attributes: { class: "text-left p-2 text-[#e4e4ed] font-medium" } },
        { action: "create", tag: "th", parent: "tr:first-child", content: "Value", attributes: { class: "text-left p-2 text-[#e4e4ed] font-medium" } },
        { action: "create", tag: "tr", parent: "table:first-child", attributes: { class: "border-b border-[#1f1f2e]" } },
        { action: "create", tag: "td", parent: "tr:last-child", content: "Alpha", attributes: { class: "p-2 text-[#8888a0]" } },
        { action: "create", tag: "td", parent: "tr:last-child", content: "100", attributes: { class: "p-2 text-[#8888a0]" } },
      ],
    },
  ];

  for (const step of steps) {
    if (step.keywords.some((k) => lower.includes(k))) {
      return step.build();
    }
  }

  return [
    { action: "create", tag: "div", content: prompt, attributes: { class: "text-[#e4e4ed] p-4" } },
  ];
}

export async function generateMock(prompt: string): Promise<DomActionType[]> {
  await new Promise((r) => setTimeout(r, 800));
  return parsePrompt(prompt);
}
