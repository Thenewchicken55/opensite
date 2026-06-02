"use client";

import { useEffect, useRef } from "react";
import { setCanvas } from "../lib/pipeline";

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      setCanvas(canvasRef.current);
    }
  }, []);

  const handleReset = () => {
    if (canvasRef.current) {
      canvasRef.current.innerHTML = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Canvas</h2>
        <button
          onClick={handleReset}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Clear
        </button>
      </div>
      <div
        ref={canvasRef}
        id="canvas"
        className="flex-1 p-8 overflow-auto"
      />
    </div>
  );
}
