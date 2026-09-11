// Severidad derivada de la clasificación que ya expone el backend (analyzeUrl).
// Regla de la paleta: --signal se reserva EXCLUSIVAMENTE para estados verificados/saludables
// y la marca de navegación; nunca para nodos neutrales del grafo.

export type Severity = "signal" | "warning" | "danger" | "neutral";

export interface GraphNode {
  kind: string;
  details?: {
    kind?: string;
    category?: string;
    secure?: boolean;
    httponly?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const SEV_COLOR: Record<Severity, string> = {
  signal: "var(--signal)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  neutral: "var(--neutral-node)",
};

export function severityOf(node: GraphNode | null | undefined): Severity {
  if (!node) return "neutral";
  const d = node.details || {};

  if (node.kind === "tracker") return "danger";

  if (node.kind === "domain") {
    if (d.kind === "tracker") return "danger";
    if (d.kind === "analytics") return "warning";
    return "neutral";
  }

  if (node.kind === "tech") {
    if (d.category === "Tracking social") return "danger";
    if (d.category === "Analytics" || d.category === "Tag Manager")
      return "warning";
    return "neutral";
  }

  if (node.kind === "cookie") {
    return d.secure && d.httponly ? "signal" : "warning";
  }

  return "neutral"; // root, categorías, fuentes
}

export const faviconUrl = (host: string) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
