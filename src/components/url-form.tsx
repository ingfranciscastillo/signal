"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";

export interface UrlFormProps {
  onAnalyze: (url: string) => void;
  loading: boolean;
  error?: string | null;
}

export default function UrlForm({ onAnalyze, loading, error }: UrlFormProps) {
  const [url, setUrl] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (url.trim() && !loading) onAnalyze(url.trim());
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-panel p-1.5 transition-colors focus-within:border-signal">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          placeholder="https://example.com"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 font-mono text-sm text-ink outline-none placeholder:text-mist"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-signal px-5 py-2.5 font-mono text-sm font-medium text-[color:var(--panel)] transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          {loading ? (
            <span className="animate-pulse">escaneando…</span>
          ) : (
            <>
              <span>analizar</span>
              <ArrowRight className="h-3.5 w-3.5" weight="bold" />
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-3 font-mono text-xs text-danger">{error}</p>}
    </form>
  );
}
