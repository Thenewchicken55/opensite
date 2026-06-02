"use client";

import { useState } from "react";
import { MessageList, type ChatMessage } from "./MessageList";
import { PromptInput } from "./PromptInput";
import { processPrompt, subscribe } from "../lib/pipeline";

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsProcessing(true);

    const unsub = subscribe((event) => {
      switch (event.type) {
        case "done": {
          const actionCount = event.actions?.length ?? 0;
          const parts = [`Executed ${actionCount} action${actionCount !== 1 ? "s" : ""}.`];
          if (event.errors?.length) {
            parts.push(`\nErrors: ${event.errors.join(", ")}`);
          }
          setMessages((prev) => [
            ...prev,
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

    await processPrompt(text);
    unsub();
  };

  const onReset = () => {
    setMessages([]);
    const canvas = document.querySelector<HTMLElement>("#canvas");
    if (canvas) canvas.innerHTML = "";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Chat</h2>
        <button
          onClick={onReset}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Reset
        </button>
      </div>
      <MessageList messages={messages} />
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <PromptInput onSend={handleSend} disabled={isProcessing} />
        {isProcessing && (
          <p className="text-xs text-zinc-400 mt-2">Model is processing...</p>
        )}
      </div>
    </div>
  );
}
