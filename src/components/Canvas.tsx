"use client";

import { useEffect, useRef } from "react";
import { setCanvas } from "../lib/pipeline";

const WELCOME_HTML = `\
<div style='font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 20px'>
  <h1 style='font-size:24px;margin-bottom:8px'>Welcome to OpenSite</h1>
  <p style='color:#666;margin-bottom:24px'>Describe what you want, and AI will build it.</p>

  <div style='background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:16px'>
    <p style='margin:0 0 8px;font-weight:600'>Try saying:</p>
    <ul style='margin:0;padding-left:20px;color:#555'>
      <li style='margin-bottom:4px'><code style='background:#e8e8e8;padding:1px 6px;border-radius:3px;font-size:13px'>make a button that says click me</code></li>
      <li style='margin-bottom:4px'><code style='background:#e8e8e8;padding:1px 6px;border-radius:3px;font-size:13px'>add an image of a cat</code></li>
      <li style='margin-bottom:4px'><code style='background:#e8e8e8;padding:1px 6px;border-radius:3px;font-size:13px'>create a wiki about rick and morty</code></li>
      <li style='margin-bottom:4px'><code style='background:#e8e8e8;padding:1px 6px;border-radius:3px;font-size:13px'>make the background blue</code></li>
      <li><code style='background:#e8e8e8;padding:1px 6px;border-radius:3px;font-size:13px'>add a navbar with 3 links</code></li>
    </ul>
  </div>

  <div style='background:#fff3cd;border-radius:8px;padding:12px;font-size:13px;color:#856404'>
    <strong>AI-generated content</strong> — This is a proof of concept. Output may vary. Images use web URLs and may not load if offline.
  </div>
</div>`;

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.innerHTML = WELCOME_HTML;
      setCanvas(canvasRef.current);
    }
  }, []);

  const handleReset = () => {
    if (canvasRef.current) {
      canvasRef.current.innerHTML = WELCOME_HTML;
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
          Welcome
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
