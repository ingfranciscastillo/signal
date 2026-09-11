"use client";

import {
  ArrowSquareOut,
  Cookie,
  FileCode,
  Globe,
  type Icon,
  ShieldWarning,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import CountUp from "@/components/count-up";
import { faviconUrl, type GraphNode, type Severity } from "@/lib/severity";

const dot: Record<Severity, string> = {
  neutral: "bg-node-neutral",
  warning: "bg-warning",
  danger: "bg-danger",
  signal: "bg-signal",
};

const iconTone: Record<Severity, string> = {
  neutral: "text-mist",
  warning: "text-warning",
  danger: "text-danger",
  signal: "text-signal",
};

const badge: Record<Severity, string> = {
  neutral: "border-line text-mist",
  warning: "border-warning text-warning",
  danger: "border-danger text-danger",
  signal: "border-signal text-signal",
};

interface Summary {
  domain: string;
  status: number;
  loadTimeMs: number;
  sizeKb: number;
  scriptsTotal: number;
  scriptsThirdParty: number;
  externalDomains: number;
  trackers: number;
  cookies: number;
  https: boolean;
}

interface SummaryCascadeProps {
  result: {
    summary: Summary;
    nodes: (GraphNode & { label: string })[];
  };
}

interface Row {
  icon: Icon;
  label: string;
  favicon?: string;
  value?: string | number;
  sub?: string;
  tone: Severity;
}

export default function SummaryCascade({ result }: SummaryCascadeProps) {
  const { summary, nodes } = result;
  const gtm = nodes.find(
    (n) => n.kind === "tech" && n.details?.category === "Tag Manager",
  );
  const analytics = nodes
    .filter((n) => n.kind === "tech" && n.details?.category === "Analytics")
    .slice(0, 2);
  const trackerNames = nodes
    .filter(
      (n) =>
        n.kind === "tracker" ||
        (n.kind === "domain" && n.details?.kind === "tracker"),
    )
    .map((n) => n.label);

  const rows: Row[] = [
    {
      icon: Globe,
      label: summary.domain,
      favicon: summary.domain,
      value: String(summary.status),
      sub: `${summary.loadTimeMs} ms · ${summary.sizeKb} KB`,
      tone: "neutral",
    },
    ...(gtm
      ? [
          {
            icon: FileCode,
            label: gtm.label,
            sub: "tag manager · carga dinámica",
            tone: "warning" as Severity,
          },
        ]
      : []),
    ...analytics.map((a) => ({
      icon: FileCode,
      label: a.label,
      sub: "analytics",
      tone: "warning" as Severity,
    })),
    {
      icon: FileCode,
      label: "scripts",
      value: summary.scriptsTotal,
      sub: `${summary.scriptsThirdParty} de terceros`,
      tone: "neutral",
    },
    {
      icon: ArrowSquareOut,
      label: "dominios externos",
      value: summary.externalDomains,
      tone: "neutral",
    },
    {
      icon: ShieldWarning,
      label: "trackers",
      value: summary.trackers,
      sub: trackerNames.slice(0, 3).join(" · ") || "ninguno detectado",
      tone: summary.trackers ? "danger" : "signal",
    },
    { icon: Cookie, label: "cookies", value: summary.cookies, tone: "neutral" },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist">
          cadena de carga
        </p>
        <p className="font-mono text-[10px] tabular-nums text-mist">
          {summary.https ? "https" : "http"} · {summary.status}
        </p>
      </header>
      <div>
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 * i }}
            className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
          >
            {r.favicon ? (
              <img
                src={faviconUrl(r.favicon)}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
                alt=""
                className="h-4 w-4 shrink-0 rounded-sm"
              />
            ) : (
              <r.icon className={`h-4 w-4 shrink-0 ${iconTone[r.tone]}`} />
            )}
            <span className="font-mono text-sm text-ink">{r.label}</span>
            {r.sub && (
              <span className="hidden truncate font-mono text-[10px] text-mist sm:inline">
                {r.sub}
              </span>
            )}
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {r.value != null && (
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-xs ${badge[r.tone]}`}
                >
                  {typeof r.value === "number" ? (
                    <CountUp value={r.value} />
                  ) : (
                    r.value
                  )}
                </span>
              )}
              <span className={`h-1.5 w-1.5 rounded-full ${dot[r.tone]}`} />
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
