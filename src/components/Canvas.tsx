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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-panel">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Canvas</h2>
        <button
          onClick={handleReset}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
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
