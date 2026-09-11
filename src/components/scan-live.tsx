"use client";

import { Broadcast } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { GraphNode } from "@/lib/severity";

type Tone = "ok" | "danger" | "neutral";

const toneClass: Record<Tone, string> = {
  ok: "text-signal",
  danger: "text-danger",
  neutral: "text-mist",
};

interface Summary {
  domain: string;
  status: number;
  loadTimeMs: number;
  sizeKb: number;
  https: boolean;
  scriptsTotal: number;
  scriptsThirdParty: number;
  cookies: number;
  trackers: number;
}

interface ScanResult {
  summary: Summary;
  nodes: (GraphNode & { label: string })[];
}

interface Line {
  text: string;
  tone: Tone;
}

// Feed con datos REALES del resultado (el backend responde de una sola vez):
// el revelado línea a línea es progresivo en cliente, sin tocar la lógica de análisis.
function buildLines(result: ScanResult): Line[] {
  const { summary, nodes } = result;
  const lines: Line[] = [
    {
      text: `${summary.domain} respondió ${summary.status} · ${summary.loadTimeMs} ms · ${summary.sizeKb} KB`,
      tone: "ok",
    },
  ];
  lines.push(
    summary.https
      ? { text: "conexión cifrada (https) verificada", tone: "ok" }
      : { text: "la conexión NO viaja cifrada (http)", tone: "danger" },
  );
  lines.push({
    text: `${summary.scriptsTotal} scripts detectados · ${summary.scriptsThirdParty} de terceros`,
    tone: "neutral",
  });
  nodes
    .filter((n) => n.kind === "tech")
    .slice(0, 5)
    .forEach((t) => {
      lines.push({
        text: `tecnología: ${t.label}`,
        tone: t.details?.category === "Tracking social" ? "danger" : "neutral",
      });
    });
  nodes
    .filter((n) => n.kind === "domain" || n.kind === "tracker")
    .slice(0, 7)
    .forEach((d) => {
      lines.push({
        text: `dominio externo: ${d.label}${d.details?.loadType === "lazy" ? " (carga lazy)" : ""}`,
        tone: d.kind === "tracker" ? "danger" : "neutral",
      });
    });
  if (summary.cookies)
    lines.push({
      text: `${summary.cookies} cookies en la respuesta inicial`,
      tone: "neutral",
    });
  if (summary.trackers)
    lines.push({
      text: `${summary.trackers} trackers con capacidad de rastreo`,
      tone: "danger",
    });
  lines.push({ text: "análisis de superficie completo", tone: "ok" });
  return lines.slice(0, 16);
}

interface ScanLiveProps {
  host: string;
  result: ScanResult | null;
  onDone?: () => void;
}

export default function ScanLive({ host, result, onDone }: ScanLiveProps) {
  const lines = result ? buildLines(result) : [];
  const stagger = lines.length > 12 ? 0.08 : 0.11;
  const [shown, setShown] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `lines` is rebuilt from `result` every render; re-run only when result/stagger actually change
  useEffect(() => {
    if (!result) return;
    setShown(0);
    const timers = lines.map((_, i) =>
      setTimeout(() => setShown(i + 1), i * stagger * 1000),
    );
    timers.push(
      setTimeout(() => onDone?.(), lines.length * stagger * 1000 + 350),
    );
    return () => timers.forEach(clearTimeout);
  }, [result, onDone, stagger, lines.length]);

  return (
    <div className="w-full max-w-2xl">
      <div className="relative mx-auto grid h-24 w-24 place-items-center">
        <span className="sonar-ring absolute h-14 w-14 rounded-full border border-signal" />
        <span
          className="sonar-ring absolute h-14 w-14 rounded-full border border-signal"
          style={{ animationDelay: "0.65s" }}
        />
        <span className="grid h-10 w-10 place-items-center rounded-full bg-signal-soft text-signal">
          <Broadcast className="h-5 w-5" />
        </span>
      </div>
      <div
        aria-live="polite"
        className="mt-3 rounded-xl border border-line bg-panel px-5 py-4 text-left font-mono text-xs"
      >
        {!result ? (
          <p className="animate-pulse text-mist">
            » estableciendo conexión con {host}…
          </p>
        ) : (
          lines.slice(0, shown).map((l) => (
            <motion.p
              key={l.text}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`py-0.5 ${toneClass[l.tone]}`}
            >
              » {l.text}
            </motion.p>
          ))
        )}
      </div>
    </div>
  );
}
