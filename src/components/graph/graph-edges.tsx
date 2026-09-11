import { memo } from "react";
import { SEV_COLOR, type Severity } from "@/lib/severity";

export interface EdgePosition {
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  fromH: number;
  toH: number;
  dashed?: boolean;
  severity: Severity;
}

interface GraphEdgesProps {
  edges: GraphEdge[];
  positions: Record<string, EdgePosition>;
  width: number;
  height: number;
  hoveredId: string | null;
}

// La velocidad del pulso comunica urgencia: los edges hacia nodos --danger corren más rápido.
const pulseDuration = (severity: Severity) =>
  severity === "danger" ? "1.1s" : "2.6s";
const pulseColor = (severity: Severity) =>
  severity === "danger"
    ? SEV_COLOR.danger
    : severity === "warning"
      ? SEV_COLOR.warning
      : "var(--fg-muted)";

// TODO(backend): mapear el grosor del trazo al volumen de datos transferidos por conexión —
// el análisis actual no expone ese dato, así que se usa grosor uniforme.
const GraphEdges = memo(function GraphEdges({
  edges,
  positions,
  width,
  height,
  hoveredId,
}: GraphEdgesProps) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {edges.map((e) => {
        const p = positions[e.from];
        const c = positions[e.to];
        if (!p || !c) return null;
        const y1 = p.y + e.fromH;
        const y2 = c.y - e.toH;
        const d = `M ${p.x} ${y1} C ${p.x} ${y1 + 44}, ${c.x} ${y2 - 44}, ${c.x} ${y2}`;
        const nearHover =
          hoveredId != null && (e.from === hoveredId || e.to === hoveredId);
        const opacity = hoveredId != null ? (nearHover ? 1 : 0.12) : 1;
        return (
          <g
            key={e.to}
            style={{
              opacity,
              transition: `opacity ${hoveredId != null ? 250 : 300}ms`,
            }}
          >
            {/* trazo base: sólido = carga directa, punteado = condicional/lazy */}
            <path
              d={d}
              fill="none"
              stroke="var(--fg-muted)"
              strokeOpacity="0.35"
              strokeWidth="1.4"
              strokeDasharray={e.dashed ? "4 6" : undefined}
            />
            {/* pulso que recorre el path en loop, opacidad baja para no saturar */}
            <path
              className="edge-pulse"
              d={d}
              pathLength={100}
              fill="none"
              stroke={pulseColor(e.severity)}
              strokeWidth="1.4"
              strokeOpacity="0.45"
              style={{ animationDuration: pulseDuration(e.severity) }}
            />
            <circle
              cx={c.x}
              cy={y2}
              r="2"
              fill={pulseColor(e.severity)}
              fillOpacity="0.8"
            />
          </g>
        );
      })}
    </svg>
  );
});

export default GraphEdges;
