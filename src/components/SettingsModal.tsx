"use client";

import { useState } from "react";
import { type Backend, setBackendPreference, getBackendPreference } from "../lib/llm";
import { loadServerConfig, saveServerConfig, type ServerLLMConfig } from "../lib/server-llm";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [backend, setBackend] = useState<Backend>(getBackendPreference);
  const [config, setConfig] = useState<ServerLLMConfig>(loadServerConfig);
  const [initialized, setInitialized] = useState(false);

  if (!open) return null;

  if (!initialized) {
    setBackend(getBackendPreference());
    setConfig(loadServerConfig());
    setInitialized(true);
  }

  const handleSave = () => {
    setBackendPreference(backend);
    saveServerConfig(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Settings</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary text-lg leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">LLM Backend</label>
            <div className="space-y-2">
              {(["webllm", "server", "mock"] as const).map((b) => (
                <label
                  key={b}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    backend === b
                      ? "border-accent bg-accent-bg"
                      : "border-border bg-surface hover:border-text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="backend"
                    value={b}
                    checked={backend === b}
                    onChange={() => setBackend(b)}
                    className="accent-accent"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary capitalize">{b}</span>
                    <span className="block text-xs text-text-muted">
                      {b === "webllm"
                        ? "Local in-browser via WebLLM (requires WebGPU)"
                        : b === "server"
                          ? "Remote LLM via OpenAI-compatible API"
                          : "Keyword-based simulation (no AI)"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {backend === "server" && (
            <div className="space-y-3 pl-1">
              <div>
                <label className="block text-xs text-text-muted mb-1">Base URL</label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="http://localhost:11434/v1"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Model</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="llama3.2"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Temperature</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-sm text-text-primary w-8 text-right tabular-nums">{config.temperature.toFixed(1)}</span>
                </div>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Works with any OpenAI-compatible API. For local use, run{" "}
                <code className="text-accent">ollama serve</code> and set the URL to{" "}
                <code className="text-accent">http://localhost:11434/v1</code>
                with model <code className="text-accent">llama3.2</code>. Run <code className="text-accent">ollama pull llama3.2</code> if needed.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
