# OpenSite — The Prompt Becomes the UI

Type stuff. Get a UI. No HTML required.

OpenSite is a browser-native playground where you describe what you want and a local LLM builds it live in the DOM. It's like having a frontend dev who works for free and never complains about your wireframes.

## 🚀 Quick Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Type something like *"delete all the text and create a wiki about chicken"*. Watch the magic.

## 🧠 How It Works

```
You type → LLM thinks → JSON actions come out → DOM changes happen
```

The LLM never writes raw HTML or JS. It outputs structured action JSON (create, update, delete, style, etc.) which gets validated by Zod and executed safely by a DOM interpreter. No script injection, no `innerHTML` chaos, no surprises.

## ⚙️ Pick Your Brain

You have options. Click **Settings** in the app to choose:

| Backend | Vibe | How |
|---------|------|-----|
| **Server** | 🟢 Recommended | Calls any OpenAI-compatible API. Run `ollama serve` locally or bring your own OpenAI key. Configure URL + model in Settings. |
| **WebLLM** | 🟡 Brave but picky | Runs Qwen2.5-1.5B in-browser via WebGPU. Needs Chrome 113+ or Edge 113+ with a GPU that doesn't quit on you. |
| **Mock** | 🔴 Debug only | Old keyword-matching simulator. No AI, just pattern matching. Great for testing, terrible for impressing your friends. |

**Quick setup for the Server backend:** Install [Ollama](https://ollama.com), run:

```bash
ollama pull llama3.2
ollama serve
```

Then in OpenSite: **Settings → Server** → defaults should just work.

## 🛠️ Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + React 19 (App Router) |
| LLM Runtime | WebLLM (WebGPU) or any OpenAI-compatible API |
| Validation | Zod |
| DOM Engine | Custom TypeScript interpreter |
| Sandboxing | Web Worker |
| State | Jotai |
| Styling | Tailwind CSS v4 |

## 🤝 Contributing

Found a bug? Want to make the chicken wiki even better? PRs welcome.
