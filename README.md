> **⚠️ Proof of Concept — Heavily AI-generated**
>
> This entire codebase was written almost entirely by LLM agents (Claude/OpenCode) with human guidance. It is a **proof of concept**, not a production application. Expect sharp edges, incomplete error handling, and the occasional hallucinated feature. Use at your own risk (and fun).

# OpenSite — The Prompt Becomes the UI

Type stuff. Get a UI. No HTML required.

OpenSite is a browser-native playground where you describe what you want and a local LLM builds it live in the DOM. It's like having a frontend dev who works for free and never complains about your wireframes.

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/Thenewchicken55/opensite.git
cd opensite
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Type something like *"make a wiki about chicken"*. Watch the magic.

### Production build

```bash
npm run build
npm start
```

## 🧠 How It Works

```
You type → LLM thinks → JSON actions come out → DOM changes happen
```

The LLM never writes raw HTML or JS. It outputs structured action JSON (create, update, delete, style, etc.) which gets validated by Zod and executed safely by a DOM interpreter. No script injection, no `innerHTML` chaos, no surprises.

## ⚙️ Pick Your Brain

Click **Settings** in the app to choose your backend:

| Backend | Vibe | How |
|---------|------|-----|
| **WebLLM** | 🟢 Works out of the box | Runs Qwen2.5-1.5B in your browser via WebGPU. **No setup needed** — just select it and wait for the model to download (needs Chrome 113+/Edge 113+). |
| **Server (Ollama)** | 🟡 Reliable, needs a local server | Runs a model on your machine via [Ollama](https://ollama.com). Better compatibility, bigger models. |
| **Server (OpenAI)** | 🔵 Paid but powerful | Bring your own OpenAI API key. Best models, no local setup. |
| **Mock** | 🔴 Debug only | Keyword-matching simulator. No AI. Great for testing layout, terrible for impressing your friends. |

### Ollama Setup (if you choose the Server backend)

1. Install [Ollama](https://ollama.com)
2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```
3. **Ollama is already running.** On Windows, Ollama installs as a background service and starts on boot (look for the llama icon in your system tray). It listens on **port 11434** by default. If you see `Error: listen tcp 127.0.0.1:11434: bind: Only one usage of each socket address` when running `ollama serve`, that means Ollama is already running — you're good.
4. In OpenSite: **Settings → Server** → defaults are already set to `http://localhost:11434/v1` with model `llama3.2`. Just click **Save** and type your prompt.

> **The Base URL field** is `http://localhost:11434/v1`. The `/v1` at the end isn't a port — it's the API path (OpenAI-compatible endpoints all use `/v1`). Port 11434 is Ollama's default; you'd only change it if you configured Ollama to use a different port.

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

Found a bug? Pls I'm desperate for help, PRs welcome.
