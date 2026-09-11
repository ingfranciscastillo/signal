"use client";

import { CornersOut, Minus, Plus } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GraphEdges, {
  type EdgePosition,
  type GraphEdge,
} from "@/components/graph/graph-edges";
import GraphNode, { type GraphNodeShape } from "@/components/graph/graph-node";
import NodeDetailPanel from "@/components/node-detail-panel";
import {
  type GraphLayoutNode,
  layoutGraph,
  nodeHalfHeight,
} from "@/lib/graph-layout";
import { severityOf } from "@/lib/severity";

// Zoom mínimo: por debajo de esto el texto deja de ser legible cuando una categoría
// (ej. Tecnologías) se expande con muchos nodos. Mejor dejar contenido fuera de vista
// (se llega arrastrando) que encogerlo hasta ser ilegible.
const MIN_K = 0.6;
const MAX_K = 2;

export interface AnalysisNode extends GraphLayoutNode {
  label: string;
  sub?: string;
  count?: number;
  details?: {
    category?: string;
    kind?: string;
    loadType?: string;
    https?: boolean;
    status?: number;
    secure?: boolean;
    httponly?: boolean;
    samesite?: string;
    raw?: string;
    types?: Record<string, number>;
    urls?: string[];
    description?: string;
    title?: string;
    [key: string]: unknown;
  };
}

interface AnalysisSummary {
  privacy: string[];
  headers: { name: string; value: string }[];
}

interface AnalysisGraphProps {
  result: {
    nodes: AnalysisNode[];
    rootId: string;
    summary: AnalysisSummary;
  };
}

type DragState =
  | {
      type: "pan";
      startX: number;
      startY: number;
      orig: { x: number; y: number };
      moved?: boolean;
    }
  | {
      type: "node";
      id: string;
      startX: number;
      startY: number;
      orig: { dx: number; dy: number };
      moved?: boolean;
    };

export default function AnalysisGraph({ result }: AnalysisGraphProps) {
  const { nodes, rootId, summary } = result;
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([rootId]),
  );
  const [selectedId, setSelectedId] = useState<string>(rootId);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<
    Record<string, { dx: number; dy: number }>
  >({}); // reubicación manual de cada nodo
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 }); // zoom + paneo del lienzo
  const [containerWidth, setContainerWidth] = useState(900);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null); // drag activo: pan del lienzo o un nodo
  const userMoved = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `result` triggers the reset (a new analysis came in); its fields (nodes/rootId) are already listed
  useEffect(() => {
    const gtm = nodes.find(
      (n) => n.kind === "tech" && n.details?.category === "Tag Manager",
    );
    setExpanded(new Set([rootId, ...(gtm ? [gtm.id] : [])]));
    setSelectedId(rootId);
    setHoveredId(null);
    setOffsets({});
    userMoved.current = false;
  }, [result, rootId, nodes]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) =>
      setContainerWidth(entries[0].contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(
    () => layoutGraph(nodes, expanded, rootId),
    [nodes, expanded, rootId],
  );
  const byId = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );
  const byIdRef = useRef(byId);
  useEffect(() => {
    byIdRef.current = byId;
  }, [byId]);

  // stagger del draw-in según orden de descubrimiento (70ms por nodo, tope 1.4s)
  const discoveryIndex = useMemo(
    () => Object.fromEntries(nodes.map((n, i) => [n.id, i])),
    [nodes],
  );

  // adyacencia para el dimming en hover (memoizada)
  const adjacency = useMemo(() => {
    const adj: Record<string, Set<string>> = {};
    nodes.forEach((n) => {
      adj[n.id] = new Set([n.id]);
    });
    nodes.forEach((n) => {
      if (n.parent && adj[n.parent]) {
        adj[n.parent].add(n.id);
        adj[n.id].add(n.parent);
      }
    });
    return adj;
  }, [nodes]);

  // posiciones finales: layout tidy-tree + desplazamiento manual de nodos
  const positions = useMemo(() => {
    const m: Record<string, EdgePosition> = {};
    layout.positioned.forEach((n) => {
      const o = offsets[n.id];
      m[n.id] = o ? { x: n.x + o.dx, y: n.y + o.dy } : { x: n.x, y: n.y };
    });
    return m;
  }, [layout, offsets]);

  const enrichedEdges = useMemo<GraphEdge[]>(
    () =>
      layout.edges.map((e) => ({
        ...e,
        fromH: nodeHalfHeight(byId[e.from]),
        toH: nodeHalfHeight(byId[e.to]),
        dashed: byId[e.to]?.details?.loadType === "lazy",
        severity: severityOf(byId[e.to]),
      })),
    [layout.edges, byId],
  );

  const hasChildren = useCallback(
    (id: string) => nodes.some((n) => n.parent === id),
    [nodes],
  );

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const select = useCallback((node: AnalysisNode) => {
    setSelectedId(node.id);
    setExpanded((prev) => new Set([...prev, node.id]));
  }, []);

  const onHover = useCallback((id: string | null) => setHoveredId(id), []);

  const onNodePointerDown = useCallback(
    (node: GraphNodeShape, e: React.PointerEvent) => {
      e.stopPropagation();
      dragRef.current = {
        type: "node",
        id: node.id,
        startX: e.clientX,
        startY: e.clientY,
        orig: offsets[node.id] || { dx: 0, dy: 0 },
      };
    },
    [offsets],
  );

  // ajuste automático al ancho disponible mientras el usuario no haya movido el lienzo
  useEffect(() => {
    if (userMoved.current) return;
    setTransform({
      k: Math.max(Math.min((containerWidth - 48) / layout.width, 1), MIN_K),
      x: 0,
      y: 0,
    });
  }, [containerWidth, layout.width]);

  // zoom con rueda centrado en el cursor (listener nativo: onWheel de React es pasivo)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      userMoved.current = true;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setTransform((t) => {
        const k = Math.max(
          MIN_K,
          Math.min(MAX_K, t.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)),
        );
        const ratio = k / t.k;
        return { k, x: mx - (mx - t.x) * ratio, y: my - (my - t.y) * ratio };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // arrastre: paneo del lienzo (fondo) o reubicación de un nodo; sin movimiento = clic (seleccionar)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < 3) return;
      d.moved = true;
      userMoved.current = true;
      if (d.type === "pan") {
        setTransform((t) => ({ ...t, x: d.orig.x + dx, y: d.orig.y + dy }));
      } else {
        setOffsets((prev) => ({
          ...prev,
          [d.id]: { dx: d.orig.dx + dx, dy: d.orig.dy + dy },
        }));
      }
    };
    const onUp = () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (d && !d.moved && d.type === "node") {
        const node = byIdRef.current[d.id];
        if (node) select(node);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [select]);

  const zoomBy = (factor: number) => {
    userMoved.current = true;
    setTransform((t) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      const cx = (rect?.width || 0) / 2;
      const cy = (rect?.height || 0) / 2;
      const k = Math.max(MIN_K, Math.min(MAX_K, t.k * factor));
      const ratio = k / t.k;
      return { k, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
    });
  };

  const fit = () => {
    userMoved.current = false;
    setTransform({
      k: Math.max(Math.min((containerWidth - 48) / layout.width, 1), MIN_K),
      x: 0,
      y: 0,
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist">
          grafo de dependencias
        </p>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 font-mono text-[10px] text-mist md:flex">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-node-neutral" />
              neutro
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              analytics
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
              tracker
            </span>
            <span>arrastra los nodos · rueda para zoom</span>
          </div>
          <div className="flex items-center rounded-full border border-line">
            <button
              type="button"
              onClick={() => zoomBy(1 / 1.25)}
              aria-label="Alejar"
              className="grid h-7 w-7 place-items-center text-mist transition-colors hover:text-ink"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => zoomBy(1.25)}
              aria-label="Acercar"
              className="grid h-7 w-7 place-items-center border-x border-line text-mist transition-colors hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={fit}
              aria-label="Ajustar a la pantalla"
              className="grid h-7 w-7 place-items-center text-mist transition-colors hover:text-ink"
            >
              <CornersOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          ref={wrapRef}
          className="relative cursor-grab overflow-hidden touch-none active:cursor-grabbing"
          style={{ height: Math.max(layout.height * transform.k + 48, 380) }}
          onPointerDown={(e) => {
            dragRef.current = {
              type: "pan",
              startX: e.clientX,
              startY: e.clientY,
              orig: { x: transform.x, y: transform.y },
            };
          }}
        >
          <div
            className="absolute left-0 top-0"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
              transformOrigin: "0 0",
            }}
          >
            <GraphEdges
              edges={enrichedEdges}
              positions={positions}
              width={layout.width}
              height={layout.height}
              hoveredId={hoveredId}
            />
            {layout.positioned.map((n) => (
              <GraphNode
                key={n.id}
                node={n}
                pos={positions[n.id]}
                selected={n.id === selectedId}
                expanded={expanded.has(n.id)}
                hasChildren={hasChildren(n.id)}
                severity={severityOf(n)}
                delay={Math.min(discoveryIndex[n.id] * 0.07, 1.4)}
                hoveredId={hoveredId}
                adjacency={adjacency}
                onNodePointerDown={onNodePointerDown}
                onToggle={toggle}
                onHover={onHover}
              />
            ))}
          </div>
        </div>
        <NodeDetailPanel
          node={byId[selectedId] || byId[rootId]}
          summary={summary}
        />
      </div>
    </div>
  );
}
