import { ShieldWarning } from "@phosphor-icons/react";

const KIND_LABELS: Record<string, string> = {
  root: "Dominio",
  category: "Categoría",
  tech: "Tecnología",
  domain: "Dominio externo",
  tracker: "Tracker",
  cookie: "Cookie",
  font: "Fuente / asset",
};

interface NodeDetails {
  status?: number;
  https?: boolean;
  loadTimeMs?: number;
  sizeKb?: number;
  scriptsTotal?: number;
  scriptsThirdParty?: number;
  thirdPartyDomains?: number;
  trackers?: number;
  cookies?: number;
  lcpMs?: number | null;
  cls?: number | null;
  ttfbMs?: number | null;
  title?: string;
  category?: string;
  description?: string;
  secure?: boolean;
  httponly?: boolean;
  samesite?: string;
  raw?: string;
  loadType?: "lazy" | "direct" | string;
  types?: Record<string, number>;
  urls?: string[];
}

interface DetailNode {
  kind: string;
  label: string;
  sub?: string;
  details?: NodeDetails;
}

interface HeaderEntry {
  name: string;
  value: string;
}

interface NodeDetailPanelSummary {
  privacy: string[];
  headers: HeaderEntry[];
}

interface NodeDetailPanelProps {
  node: DetailNode | null;
  summary: NodeDetailPanelSummary;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-mist">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-ink">{value}</span>
    </div>
  );
}

function UrlList({ urls }: { urls: string[] }) {
  return (
    <div className="space-y-1.5">
      {urls.map((u) => (
        <p key={u} className="truncate font-mono text-[10px] text-mist">
          {u}
        </p>
      ))}
    </div>
  );
}

export default function NodeDetailPanel({
  node,
  summary,
}: NodeDetailPanelProps) {
  if (!node) return null;
  const d = node.details || {};

  let body: React.ReactNode = null;
  if (node.kind === "root") {
    body = (
      <div className="space-y-6">
        <div>
          <Metric label="Estado" value={d.status} />
          <Metric label="Protocolo" value={d.https ? "https" : "http"} />
          <Metric label="Carga" value={`${d.loadTimeMs} ms`} />
          <Metric label="Tamaño" value={`${d.sizeKb} KB`} />
          <Metric
            label="Scripts"
            value={
              d.scriptsTotal +
              (d.scriptsThirdParty
                ? ` · ${d.scriptsThirdParty} de terceros`
                : "")
            }
          />
          <Metric label="Dominios externos" value={d.thirdPartyDomains} />
          <Metric label="Trackers" value={d.trackers} />
          <Metric label="Cookies" value={d.cookies} />
          <Metric
            label="TTFB"
            value={d.ttfbMs != null ? `${Math.round(d.ttfbMs)} ms` : "—"}
          />
          <Metric
            label="LCP"
            value={d.lcpMs != null ? `${Math.round(d.lcpMs)} ms` : "—"}
          />
          <Metric label="CLS" value={d.cls != null ? d.cls.toFixed(3) : "—"} />
        </div>
        {d.title && (
          <p className="font-heading text-sm italic text-mist">“{d.title}”</p>
        )}
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mist">
            Privacidad
          </p>
          {summary.privacy.length ? (
            <ul className="space-y-2">
              {summary.privacy.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <ShieldWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                  <span className="text-xs leading-relaxed text-mist">{p}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-mist">
              Sin señales de alerta evidentes en la superficie.
            </p>
          )}
        </div>
        {summary.headers.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mist">
              Headers de respuesta
            </p>
            <div className="space-y-2">
              {summary.headers.map((h) => (
                <div key={h.name}>
                  <p className="font-mono text-[10px] text-ink">{h.name}</p>
                  <p className="truncate font-mono text-[10px] text-mist">
                    {h.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } else if (node.kind === "category") {
    body = <p className="text-xs leading-relaxed text-mist">{d.description}</p>;
  } else if (node.kind === "tech") {
    body = (
      <div className="space-y-3">
        {d.category && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
            {d.category}
          </p>
        )}
        <p className="text-xs leading-relaxed text-mist">
          {d.description || "Detectada por firmas en el HTML de la página."}
        </p>
      </div>
    );
  } else if (node.kind === "cookie") {
    body = (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(["secure", "httponly"] as const).map((f) => (
            <span
              key={f}
              className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                d[f] ? "border-signal text-signal" : "border-danger text-danger"
              }`}
            >
              {f}
            </span>
          ))}
          {d.samesite && (
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-mist">
              samesite={d.samesite}
            </span>
          )}
        </div>
        <p className="break-all font-mono text-[10px] leading-relaxed text-mist">
          {d.raw}
        </p>
      </div>
    );
  } else if (
    node.kind === "domain" ||
    node.kind === "tracker" ||
    node.kind === "font"
  ) {
    body = (
      <div className="space-y-3">
        {d.loadType && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
            carga:{" "}
            {d.loadType === "lazy"
              ? "condicional / lazy (async · defer)"
              : "directa"}
          </p>
        )}
        {d.types && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(d.types).map(([t, n]) => (
              <span
                key={t}
                className="rounded-full border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-mist"
              >
                {t} ×{n}
              </span>
            ))}
          </div>
        )}
        {d.urls && <UrlList urls={d.urls} />}
      </div>
    );
  }

  return (
    <aside className="relative border-t border-line bg-canvas p-6 lg:max-h-[640px] lg:overflow-y-auto lg:border-l lg:border-t-0">
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist">
          {KIND_LABELS[node.kind] || "Nodo"}
        </p>
        <p
          className={`mt-1 break-all text-ink ${
            node.kind === "root"
              ? "font-heading text-xl font-semibold"
              : "font-mono text-sm"
          }`}
        >
          {node.label}
        </p>
        {node.sub && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-mist">
            {node.sub}
          </p>
        )}
      </div>
      {body}
    </aside>
  );
}
