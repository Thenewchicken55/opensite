# Implementation Plan — OpenSite

## Phase 0: Project Setup
- [ ] 0.1 Install WebLLM npm package
- [ ] 0.2 Install Zod
- [ ] 0.3 Install Jotai
- [ ] 0.4 Verify dev server still runs after deps added
- [ ] 0.5 Clean up default Next.js boilerplate from `src/app/page.tsx`
- [ ] 0.6 Clean up default globals.css (keep Tailwind directives)

## Phase 1: Action Schema (Zod)
- [ ] 1.1 Define `DomAction` union type: `create | update | delete | style | insert | replace`
- [ ] 1.2 Define `CreateAction` schema (tag, parent, attributes, content, position)
- [ ] 1.3 Define `UpdateAction` schema (selector, content, attributes)
- [ ] 1.4 Define `DeleteAction` schema (selector)
- [ ] 1.5 Define `StyleAction` schema (selector, styles: Record<string, string>)
- [ ] 1.6 Define `InsertAction` schema (selector, position, html)
- [ ] 1.7 Define `ReplaceAction` schema (selector, tag, content)
- [ ] 1.8 Add `maxActions` limit constant (e.g., 20)
- [ ] 1.9 Define `ActionList` schema: array of DomAction with max length
- [ ] 1.10 Write unit tests for each schema validation
- [ ] 1.11 Export all schemas from a barrel file `src/lib/schema.ts`

## Phase 2: DOM Interpreter
- [ ] 2.1 Create `src/lib/interpreter.ts`
- [ ] 2.2 Implement `executeCreate(action)` — document.createElement + append/insert
- [ ] 2.3 Implement `executeUpdate(action)` — querySelector + mutate textContent/attributes
- [ ] 2.4 Implement `executeDelete(action)` — querySelector + remove (with safety checks)
- [ ] 2.5 Implement `executeStyle(action)` — querySelector + Object.assign style
- [ ] 2.6 Implement `executeInsert(action)` — insertAdjacentHTML
- [ ] 2.7 Implement `executeReplace(action)` — replaceChild
- [ ] 2.8 Add safety guard: prevent removing `body`, `html`, `head`
- [ ] 2.9 Add safety guard: prevent inserting `<script>` tags
- [ ] 2.10 Add safety guard: max actions per batch
- [ ] 2.11 Add action logging for debugging
- [ ] 2.12 Implement `executeAll(actions)` — iterate and collect results/errors
- [ ] 2.13 Export `executeAll` as main entry point

## Phase 3: Undo/Redo System
- [ ] 3.1 Define `Snapshot` type: serialized DOM state or action inverse
- [ ] 3.2 Implement `takeSnapshot()` — save current state of affected elements
- [ ] 3.3 Implement `restoreSnapshot(snapshot)` — revert to saved state
- [ ] 3.4 Create Zustand/Jotai store for undo stack
- [ ] 3.5 Create store for redo stack
- [ ] 3.6 Push snapshots before each action batch execution
- [ ] 3.7 Implement `undo()` — pop from undo, push to redo, restore
- [ ] 3.8 Implement `redo()` — pop from redo, push to undo, restore
- [ ] 3.9 Add `canUndo` / `canRedo` computed booleans
- [ ] 3.10 Test undo/redo with multi-action sequences

## Phase 4: WebLLM Integration
- [ ] 4.1 Research WebLLM docs and API
- [ ] 4.2 Create `src/lib/llm.ts` — WebLLM wrapper module
- [ ] 4.3 Implement `initModel()` — load model with progress callback
- [ ] 4.4 Implement `generate(prompt)` — send prompt, receive response text
- [ ] 4.5 Create system prompt that instructs model to output JSON actions only
- [ ] 4.6 Add model config: temperature, max tokens, top_p
- [ ] 4.7 Add model unloading / cleanup
- [ ] 4.8 Handle model loading error states
- [ ] 4.9 Handle generation timeout
- [ ] 4.10 Handle malformed JSON output (try/catch + retry)
- [ ] 4.11 Create `src/lib/llm-worker.ts` — Web Worker entry point
- [ ] 4.12 Create `src/lib/llm-worker-client.ts` — message-passing proxy
- [ ] 4.13 Move model init + inference into the worker
- [ ] 4.14 Test worker communication with mock responses

## Phase 5: Prompt Pipeline
- [ ] 5.1 Create `src/lib/pipeline.ts` — orchestrator module
- [ ] 5.2 Implement `processPrompt(userInput)`:
  - [ ] 5.2a Build system prompt with schema instructions
  - [ ] 5.2b Send to LLM
  - [ ] 5.2c Parse JSON from response
  - [ ] 5.2d Validate with Zod schema
  - [ ] 5.2e If invalid: log error, return error to user
  - [ ] 5.2f If valid: execute DOM actions
  - [ ] 5.2g Push undo snapshot
- [ ] 5.3 Add user message to conversation history
- [ ] 5.4 Add assistant response to conversation history
- [ ] 5.5 Limit conversation history length (e.g., last 10 turns)
- [ ] 5.6 Add pipeline event emitter (loading, done, error, actions)
- [ ] 5.7 Handle streaming vs non-streaming responses

## Phase 6: Chat UI
- [ ] 6.1 Create `src/components/ChatPanel.tsx` — main chat container
- [ ] 6.2 Create `src/components/MessageList.tsx` — scrollable message history
- [ ] 6.3 Create `src/components/MessageBubble.tsx` — single message display
- [ ] 6.4 Create `src/components/PromptInput.tsx` — textarea + send button
- [ ] 6.5 Create `src/components/ModelStatusBar.tsx` — shows model load state
- [ ] 6.6 Style all components with Tailwind (dark theme)
- [ ] 6.7 Auto-scroll to bottom on new messages
- [ ] 6.8 Disable input while model is processing
- [ ] 6.9 Show typing indicator during generation
- [ ] 6.10 Handle Enter to send, Shift+Enter for newline
- [ ] 6.11 Add character count / token estimate display

## Phase 7: Canvas / Preview Pane
- [ ] 7.1 Create `src/components/Canvas.tsx` — the DOM playground container
- [ ] 7.2 Render canvas as a `<div>` with known id (e.g., `#canvas`)
- [ ] 7.3 Canvas should be a "clean slate" — no default content except a title
- [ ] 7.4 Add a "Reset Canvas" button that clears all LLM-generated elements
- [ ] 7.5 Style canvas with a subtle border to distinguish from chrome
- [ ] 7.6 Add resize handle (optional: side-by-side vs stacked layout)
- [ ] 7.7 Support fullscreen canvas mode

## Phase 8: Main Layout
- [ ] 8.1 Create `src/app/page.tsx` — layout with ChatPanel + Canvas
- [ ] 8.2 Use flexbox/grid: chat on left, canvas on right
- [ ] 8.3 Add app header with logo + model info + reset button
- [ ] 8.4 Add keyboard shortcuts hint (Ctrl+Z undo, Ctrl+Shift+Z redo)
- [ ] 8.5 Responsive: stack vertically on small screens
- [ ] 8.6 Style everything with Tailwind

## Phase 9: Controls & Toolbar
- [ ] 9.1 Create `src/components/Toolbar.tsx`
- [ ] 9.2 Add undo button (with keyboard shortcut Ctrl+Z)
- [ ] 9.3 Add redo button (Ctrl+Shift+Z)
- [ ] 9.4 Add reset button (with confirmation dialog)
- [ ] 9.5 Add model selector dropdown (if multiple models available)
- [ ] 9.6 Add temperature slider
- [ ] 9.7 Add "Copy actions JSON" debug button
- [ ] 9.8 Show action count per prompt

## Phase 10: DOM Snapshot Display (LLM Context)
- [ ] 10.1 Implement `serializeDom()` — convert canvas child nodes to JSON tree
- [ ] 10.2 Include element tag, attributes, text content, position in tree
- [ ] 10.3 Exclude non-LLM-added elements (safety)
- [ ] 10.4 Include this snapshot in the system prompt for multi-turn
- [ ] 10.5 Keep snapshot under token limit (truncate if needed)
- [ ] 10.6 Update snapshot after each action batch

## Phase 11: Error Handling & Edge Cases
- [ ] 11.1 Handle LLM output that is not valid JSON
- [ ] 11.2 Handle LLM output that is valid JSON but invalid per schema
- [ ] 11.3 Handle LLM output exceeding max action limit
- [ ] 11.4 Handle selector not found in DOM
- [ ] 11.5 Handle duplicate IDs in created elements
- [ ] 11.6 Handle model loading failure (no WebGPU, out of memory)
- [ ] 11.7 Handle canvas being empty on first render
- [ ] 11.8 Handle rapid successive prompts (queue vs debounce)
- [ ] 11.9 Show user-friendly error messages for each case

## Phase 12: Advanced DOM Actions
- [ ] 12.1 Add `move` action (move element to new parent/position)
- [ ] 12.2 Add `clone` action (deep clone an element)
- [ ] 12.3 Add `setAttr` action (set single attribute)
- [ ] 12.4 Add `removeAttr` action (remove single attribute)
- [ ] 12.5 Add `addClass` / `removeClass` actions
- [ ] 12.6 Add `setText` action (set text content only, no HTML)
- [ ] 12.7 Add `setHTML` action (set innerHTML — restricted, logged)
- [ ] 12.8 Add `animate` action (CSS transitions/animations)

## Phase 13: State Management
- [ ] 13.1 Create `src/store/atoms.ts` — Jotai atoms
- [ ] 13.2 Define `messagesAtom` — array of chat messages
- [ ] 13.3 Define `actionsAtom` — last executed actions for display
- [ ] 13.4 Define `modelStateAtom` — loading | ready | error | generating
- [ ] 13.5 Define `canvasStateAtom` — serialized DOM snapshot
- [ ] 13.6 Define `undoStackAtom` / `redoStackAtom`
- [ ] 13.7 Define `settingsAtom` — temperature, maxTokens, modelName
- [ ] 13.8 Wire atoms through the component tree

## Phase 14: Model Selection & Download Management
- [ ] 14.1 Support multiple model sizes (e.g., Phi-3-mini, Qwen-1.5B)
- [ ] 14.2 Show download progress bar during model fetch
- [ ] 14.3 Show model size and estimated download time
- [ ] 14.4 Cache model in IndexedDB for offline use
- [ ] 14.5 Allow user to clear cached model
- [ ] 14.6 Detect WebGPU support and show warning if unavailable
- [ ] 14.7 Fallback to WASM or CPU if WebGPU not available

## Phase 15: Prompt Engineering & System Prompt
- [ ] 15.1 Write system prompt v1 — instructs JSON-only output
- [ ] 15.2 Include action schema in system prompt
- [ ] 15.3 Include examples of good action sequences
- [ ] 15.4 Include current DOM snapshot in prompt
- [ ] 15.5 Iterate: test with real prompts and refine
- [ ] 15.6 Add few-shot examples in the prompt
- [ ] 15.7 Handle edge: model trying to use non-existent selectors

## Phase 16: UX Polish
- [ ] 16.1 Add smooth transitions when DOM changes
- [ ] 16.2 Add toast notifications for errors
- [ ] 16.3 Add loading skeleton for model download
- [ ] 16.4 Add welcome / onboarding message
- [ ] 16.5 Add "What can I do?" example prompts
- [ ] 16.6 Add dark/light mode toggle
- [ ] 16.7 Persist chat history in localStorage
- [ ] 16.8 Add "Clear chat" button
- [ ] 16.9 Keyboard shortcut help modal

## Phase 17: Performance
- [ ] 17.1 Batch DOM mutations to reduce reflows
- [ ] 17.2 Use requestAnimationFrame for DOM writes
- [ ] 17.3 Debounce DOM snapshot serialization
- [ ] 17.4 Limit conversation history to prevent prompt bloat
- [ ] 17.5 Lazy-load WebLLM worker (not on initial page load)
- [ ] 17.6 Memoize React components where appropriate
- [ ] 17.7 Profile and optimize render cycles

## Phase 18: Testing
- [ ] 18.1 Unit test all Zod schemas
- [ ] 18.2 Unit test DOM interpreter (with jsdom or happy-dom)
- [ ] 18.3 Unit test undo/redo logic
- [ ] 18.4 Unit test pipeline orchestrator (mock LLM)
- [ ] 18.5 Integration test: prompt → actions → DOM
- [ ] 18.6 Test error recovery flows
- [ ] 18.7 Test with actual WebLLM (manual QA)

## Phase 19: Future / Stretch Goals
- [ ] 19.1 Multi-agent: LLM that critiques/changes other LLM's output
- [ ] 19.2 Canvas API support (LLM draws graphics)
- [ ] 19.3 Export generated page as static HTML
- [ ] 19.4 Shareable URLs that reproduce the DOM state
- [ ] 19.5 Voice input
- [ ] 19.6 Image generation in canvas
- [ ] 19.7 Data fetching tool (LLM can fetch external data)
- [ ] 19.8 Component library mode (LLM uses predefined components)
- [ ] 19.9 "Inception mode" — LLM can embed another instance of the app
