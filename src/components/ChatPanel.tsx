"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageList, type ChatMessage } from "./MessageList";
import { PromptInput } from "./PromptInput";
import { SettingsModal } from "./SettingsModal";
import { processPrompt, subscribe } from "../lib/pipeline";
import { detectBackend, getEffectiveBackend } from "../lib/llm";

const HISTORY_KEY = "opensite-chat-history";
const MAX_HISTORY = 20;

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(messages: ChatMessage[]): void {
  try {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backend, setBackend] = useState<"detecting" | "webllm" | "server" | "mock">("detecting");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    detectBackend().then(setBackend);
  }, []);

  useEffect(() => {
    const saved = loadHistory();
    if (saved.length > 0) setMessages(saved);
  }, []);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    const unsub = subscribe((event) => {
      switch (event.type) {
        case "generating": {
          setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);
          break;
        }
        case "done": {
          const actionCount = event.actions?.length ?? 0;
          const actionTypes = event.actions?.map((a) => a.action) ?? [];
          const summary = actionTypes.includes("clear")
            ? "Cleared canvas and built new page"
            : `Executed ${actionCount} action${actionCount !== 1 ? "s" : ""}`;
          const parts = [`${summary}.`];
          if (event.errors?.length) {
            parts.push(`\nWarnings: ${event.errors.join(", ")}`);
          }
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: parts.join("") },
          ]);
          setIsProcessing(false);
          break;
        }
        case "error": {
          setMessages((prev) => [
            ...prev,
            { role: "error", content: event.message ?? "Unknown error" },
          ]);
          setIsProcessing(false);
          break;
        }
      }
    });

    const history = messages
      .filter((m) => m.role === "user")
      .slice(-10)
      .map((m) => ({ role: "user" as const, content: m.content }));

    await processPrompt(text, history);
    setBackend(getEffectiveBackend());
    unsub();
  }, [messages]);

  const handleReset = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(HISTORY_KEY);
    const canvas = document.querySelector<HTMLElement>("#canvas");
    if (canvas) canvas.innerHTML = "";
  }, []);

  const handleSettingsSaved = useCallback(() => {
    setBackend("detecting");
    detectBackend().then(setBackend);
  }, []);

  const backendLabel =
    backend === "detecting"
      ? "..."
      : backend === "webllm"
        ? "WebLLM"
        : backend === "server"
          ? "Server"
          : "Mock";

  const backendColor =
    backend === "webllm"
      ? "bg-green-900/30 text-green-400"
      : backend === "server"
        ? "bg-blue-900/30 text-blue-400"
        : backend === "mock"
          ? "bg-amber-900/30 text-amber-400"
          : "bg-zinc-800 text-text-muted";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Chat</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            title="Settings"
          >
            Settings
          </button>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${backendColor}`}>
            {backendLabel}
          </span>
          <button
            onClick={handleReset}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <MessageList messages={messages} />
      <div className="p-4 border-t border-border shrink-0">
        <PromptInput onSend={handleSend} disabled={isProcessing} />
        {isProcessing && (
          <p className="text-xs text-text-muted mt-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
            Generating...
          </p>
        )}
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          handleSettingsSaved();
        }}
      />
    </div>
  );
}
