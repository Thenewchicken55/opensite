"use client";

interface MessageBubbleProps {
  role: "user" | "assistant" | "error";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  const isError = role === "error";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-accent text-white"
            : isError
              ? "bg-red-900/30 text-red-300 border border-red-800/50"
              : "bg-surface text-text-primary border border-border/50"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
