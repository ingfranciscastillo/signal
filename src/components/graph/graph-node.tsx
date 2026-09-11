"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";
import { faviconUrl, SEV_COLOR, type Severity } from "@/lib/severity";

export interface GraphNodeShape {
  id: string;
  kind: string;
  label: string;
  sub?: string;
  count?: number | null;
  details?: {
    https?: boolean;
    status?: number;
    [key: string]: unknown;
  };
}

interface TogglePillProps {
  expanded: boolean;
  onClick: () => void;
}

function TogglePill({ expanded, onClick }: TogglePillProps) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={expanded ? "Colapsar" : "Expandir"}
      className="absolute -bottom-2.5 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border border-line bg-panel text-mist transition-colors hover:border-ink hover:text-ink"
    >
      {expanded ? (
        <Minus className="h-2.5 w-2.5" />
      ) : (
        <Plus className="h-2.5 w-2.5" />
      )}
    </button>
  );
}

const hideImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.visibility = "hidden";
};

const CAPSULE: Record<string, string> = {
  root: "px-4 py-2.5",
  category: "px-3.5 py-1.5",
};

interface GraphNodeProps {
  node: GraphNodeShape;
  pos: { x: number; y: number };
  selected: boolean;
  expanded: boolean;
  hasChildren: boolean;
  severity: Severity;
  delay: number;
  hoveredId: string | null;
  adjacency?: Record<string, Set<string>> | null;
  onNodePointerDown: (node: GraphNodeShape, e: React.PointerEvent) => void;
  onToggle: (id: string) => void;
  onHover: (id: string | null) => void;
}

// Cápsula arrastrable con favicon/dominio mono y borde dibujado según severidad.
// Draw-in: stroke-dashoffset 1 → 0 en 450ms; el contenido hace fade a los 200ms.
// Un clic sin arrastre selecciona el nodo; el arrastre lo reubica en el lienzo.
const GraphNode = memo(function GraphNode({
  node,
  pos,
  selected,
  expanded,
  hasChildren,
  severity,
  delay,
  hoveredId,
  adjacency,
  onNodePointerDown,
  onToggle,
  onHover,
}: GraphNodeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps aren't read in the body, they trigger re-measuring contentRef when the capsule's rendered content changes
  useEffect(() => {
    if (contentRef.current)
      setSize({
        w: contentRef.current.offsetWidth,
        h: contentRef.current.offsetHeight,
      });
  }, [node.label, node.sub, node.count]);

  const sevColor = SEV_COLOR[severity] || SEV_COLOR.neutral;
  const nearHover = hoveredId != null && adjacency?.[hoveredId]?.has(node.id);
  const opacity = hoveredId != null ? (nearHover ? 1 : 0.3) : 1;
  const isDomainish =
    node.kind === "root" ||
    node.kind === "domain" ||
    node.kind === "tracker" ||
    node.kind === "font";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: pos.x, top: pos.y }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className="relative transition-transform duration-150 ease-out hover:scale-[1.05]"
        style={{
          opacity,
          transition: `opacity ${hoveredId != null ? 250 : 300}ms, transform 150ms ease-out`,
        }}
      >
        <div
          ref={contentRef}
          onPointerDown={(e) => onNodePointerDown(node, e)}
          className={`relative cursor-grab rounded-full bg-panel active:cursor-grabbing ${CAPSULE[node.kind] || "px-3 py-1.5"}`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {isDomainish ? (
              <img
                src={faviconUrl(node.label)}
                onError={hideImg}
                alt=""
                className="h-3.5 w-3.5 shrink-0 rounded-sm"
              />
            ) : (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: sevColor }}
              />
            )}
            {node.kind === "root" ? (
              <>
                <span className="font-mono text-sm font-semibold text-ink">
                  {node.label}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist">
                  {node.details?.https ? "https" : "http"} ·{" "}
                  {node.details?.status}
                </span>
              </>
            ) : node.kind === "category" ? (
              <>
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-mist">
                  {node.label}
                </span>
                {node.count != null && (
                  <span className="rounded-full border border-line px-1.5 font-mono text-[10px] tabular-nums text-mist">
                    {node.count}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="font-mono text-xs text-ink">{node.label}</span>
                {node.count != null && (
                  <span className="font-mono text-[10px] tabular-nums text-mist">
                    {node.count}
                  </span>
                )}
                {node.sub && (
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.15em] ${node.kind === "tracker" ? "text-danger" : "text-mist"}`}
                  >
                    {node.sub}
                  </span>
                )}
              </>
            )}
          </motion.div>
          {hasChildren && (
            <TogglePill expanded={expanded} onClick={() => onToggle(node.id)} />
          )}
        </div>
        {size && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={size.w}
            height={size.h}
          >
            <motion.rect
              x="1"
              y="1"
              width={size.w - 2}
              height={size.h - 2}
              rx={(size.h - 2) / 2}
              pathLength={1}
              fill="none"
              stroke={sevColor}
              strokeWidth={selected ? 2 : 1.25}
              strokeDasharray="1 1"
              initial={{ strokeDashoffset: 1 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1], delay }}
            />
          </svg>
        )}
        {/* Alerta controlada al asignarse severidad: glow breve del color correspondiente (500ms total) */}
        {(severity === "danger" || severity === "warning") && (
          <motion.span
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.18 }}
            transition={{ duration: 0.5, delay: delay + 0.45 }}
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: sevColor, filter: "blur(8px)" }}
          />
        )}
      </div>
    </motion.div>
  );
});

export default GraphNode;
