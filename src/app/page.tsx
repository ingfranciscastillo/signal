"use client";

import { Pulse } from "@phosphor-icons/react";
import { MotionConfig } from "motion/react";
import { useCallback, useRef, useState } from "react";
import AnalysisGraph, { type AnalysisNode } from "@/components/analysis-graph";
import Hero from "@/components/hero";
import ScanLive from "@/components/scan-live";
import SummaryCascade from "@/components/summary-cascade";
import ThemeToggle from "@/components/theme-toggle";

type Phase = "idle" | "loading" | "revealing" | "done";
type View = "summary" | "graph";

interface AnalyzeSummary {
  domain: string;
  status: number;
  loadTimeMs: number;
  sizeKb: number;
  https: boolean;
  scriptsTotal: number;
  scriptsThirdParty: number;
  externalDomains: number;
  trackers: number;
  cookies: number;
  privacy: string[];
  headers: { name: string; value: string }[];
}

interface AnalyzeResult {
  summary: AnalyzeSummary;
  nodes: AnalysisNode[];
  rootId: string;
}

export default function Home() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [scanHost, setScanHost] = useState("");
  const [view, setView] = useState<View>("graph");
  const resultsRef = useRef<HTMLElement>(null);

  const handleRevealed = useCallback(() => setPhase("done"), []);

  const analyze = async (url: string) => {
    setScanHost(url.replace(/^https?:\/\//i, "").split("/")[0] || url);
    setResult(null);
    setError("");
    setPhase("loading");
    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data?.nodes) {
        throw new Error(data?.error || "Respuesta inesperada del análisis.");
      }
      setResult(data);
      setPhase("revealing");
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
        120,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo analizar la URL.",
      );
      setPhase("idle");
    }
  };

  const busy = phase === "loading" || phase === "revealing";

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-signal-soft text-signal">
              <Pulse className="h-4 w-4" />
            </span>
            <p className="font-heading text-lg font-semibold tracking-tight text-ink">
              Signal
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-mist sm:block">
              web surface analysis
            </p>
            <ThemeToggle />
          </div>
        </header>

        <Hero onAnalyze={analyze} loading={busy} error={error} />

        <main
          ref={resultsRef}
          className="mx-auto max-w-6xl scroll-mt-8 px-4 pb-24"
        >
          {busy && (
            <div className="flex justify-center pt-2 pb-8">
              <ScanLive
                host={scanHost}
                result={phase === "revealing" ? result : null}
                onDone={handleRevealed}
              />
            </div>
          )}
          {phase === "done" && result && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex rounded-full border border-line p-0.5 font-mono text-[11px] lowercase">
                  <button
                    type="button"
                    onClick={() => setView("summary")}
                    className={`rounded-full px-3.5 py-1 transition-colors ${view === "summary" ? "bg-ink" : "text-mist hover:text-ink"}`}
                    style={
                      view === "summary" ? { color: "var(--bg)" } : undefined
                    }
                  >
                    resumen
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("graph")}
                    className={`rounded-full px-3.5 py-1 transition-colors ${view === "graph" ? "bg-ink" : "text-mist hover:text-ink"}`}
                    style={
                      view === "graph" ? { color: "var(--bg)" } : undefined
                    }
                  >
                    grafo
                  </button>
                </div>
                <p className="hidden font-mono text-[10px] tabular-nums text-mist sm:block">
                  {result.summary.domain} · {result.summary.scriptsTotal}{" "}
                  scripts · {result.summary.trackers} trackers
                </p>
              </div>
              {view === "summary" ? (
                <SummaryCascade result={result} />
              ) : (
                <AnalysisGraph result={result} />
              )}
            </div>
          )}
        </main>

        <footer className="border-t border-line py-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist">
            Signal · diagnóstico de superficie web
          </p>
        </footer>
      </div>
    </MotionConfig>
  );
}
