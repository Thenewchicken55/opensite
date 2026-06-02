# OpenSite — The Prompt Becomes the UI

A browser-native playground where user prompts control the DOM through a local LLM.

## Architecture

```
User Prompt
     ↓
WebLLM (browser-side model, WebGPU)
     ↓
Validated JSON Actions (Zod)
     ↓
DOM Interpreter (custom TS module)
     ↓
Real DOM Mutations
```

The model never writes raw HTML or JS. It outputs structured action JSON which is validated and executed safely.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + React 19 (App Router) |
| LLM Runtime | WebLLM (WebGPU) |
| Validation | Zod |
| DOM Engine | Custom TypeScript interpreter |
| Sandboxing | Web Worker |
| State | Jotai |
| Styling | Tailwind CSS v4 |

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
