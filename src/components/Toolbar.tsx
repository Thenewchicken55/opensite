"use client";

import { useState, useEffect } from "react";
import { undo, redo, getUndoCount, getRedoCount } from "../lib/pipeline";

export function Toolbar() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener("keydown", handler as unknown as EventListener);
    return () => window.removeEventListener("keydown", handler as unknown as EventListener);
  }, []);

  const handleUndo = () => {
    const canvas = document.querySelector<HTMLElement>("#canvas");
    if (canvas) undo(canvas);
    forceUpdate((n) => n + 1);
  };

  const handleRedo = () => {
    const canvas = document.querySelector<HTMLElement>("#canvas");
    if (canvas) redo(canvas);
    forceUpdate((n) => n + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const canUndo = getUndoCount() > 0;
  const canRedo = getRedoCount() > 0;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className="px-3 py-1 text-xs font-medium rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className="px-3 py-1 text-xs font-medium rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Shift+Z)"
      >
        Redo
      </button>
      <span className="text-xs text-zinc-400 ml-auto">
        Ctrl+Z to undo &middot; Ctrl+Shift+Z to redo
      </span>
    </div>
  );
}
