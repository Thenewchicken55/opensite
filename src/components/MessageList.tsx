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
        <p className="text-text-muted text-sm mb-2">Welcome to OpenSite</p>
        <p className="text-text-muted text-xs max-w-xs">
          Type a prompt below to build a UI. Try <span className="text-accent">&ldquo;create a login form&rdquo;</span> or{" "}
          <span className="text-accent">&ldquo;make a red button&rdquo;</span>.
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
