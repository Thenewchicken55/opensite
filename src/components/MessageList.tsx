"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

export interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-2">Welcome to OpenSite</p>
        <p className="text-zinc-400 dark:text-zinc-500 text-xs">
          Type a prompt below to start building your UI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((msg, i) => (
        <MessageBubble key={i} role={msg.role} content={msg.content} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
