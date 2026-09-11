// Layout de árbol ordenado ("tidy tree") para el grafo de Signal.

export interface GraphLayoutNode {
  id: string;
  parent?: string;
  kind: string;
  [key: string]: unknown;
}

export interface PositionedGraphNode extends GraphLayoutNode {
  x: number;
  y: number;
}

export interface GraphLayoutEdge {
  from: string;
  to: string;
}

export interface GraphLayoutResult {
  positioned: PositionedGraphNode[];
  positions: Record<string, { x: number; y: number }>;
  edges: GraphLayoutEdge[];
  width: number;
  height: number;
}

const HALF_HEIGHT: Record<string, number> = { root: 24, category: 20 };

// Altura media de cada tipo de cápsula, para anclar los extremos de los edges.
export const nodeHalfHeight = (node?: { kind?: string } | null) =>
  HALF_HEIGHT[node?.kind ?? ""] ?? 16;

export function layoutGraph(
  nodes: GraphLayoutNode[],
  expandedIds: Set<string>,
  rootId: string,
): GraphLayoutResult {
  const childrenMap: Record<string, GraphLayoutNode[]> = {};
  const byId: Record<string, GraphLayoutNode> = {};
  nodes.forEach((n) => {
    byId[n.id] = n;
    if (n.parent) {
      childrenMap[n.parent] = childrenMap[n.parent] || [];
      childrenMap[n.parent].push(n);
    }
  });

  const depths: Record<string, number> = { [rootId]: 0 };
  const visible: GraphLayoutNode[] = [];
  const queue: string[] = [rootId];
  while (queue.length) {
    const id = queue.shift();
    if (!id || !byId[id]) continue;
    visible.push(byId[id]);
    if (expandedIds.has(id) && childrenMap[id]) {
      childrenMap[id].forEach((c) => {
        depths[c.id] = depths[id] + 1;
        queue.push(c.id);
      });
    }
  }

  const LEVEL_H = 150;
  const GAP = 28;
  const widths: Record<string, number> = {
    root: 260,
    category: 210,
    default: 180,
  };
  let cursor = 0;
  const x: Record<string, number> = {};
  const place = (id: string): number => {
    const node = byId[id];
    const w = widths[node.kind] || widths.default;
    const kids = expandedIds.has(id) ? childrenMap[id] : null;
    if (!kids?.length) {
      x[id] = cursor + w / 2;
      cursor += w + GAP;
      return x[id];
    }
    const xs = kids.map((k) => place(k.id));
    x[id] = (xs[0] + xs[xs.length - 1]) / 2;
    return x[id];
  };
  place(rootId);

  const width = Math.max(cursor - GAP, 320);
  const maxY = visible.reduce((m, n) => Math.max(m, depths[n.id]), 0);
  const height = maxY * LEVEL_H + 140;

  const positioned = visible.map((n) => ({
    ...n,
    x: x[n.id],
    y: depths[n.id] * LEVEL_H + 70,
  }));
  const positions = Object.fromEntries(
    positioned.map((n) => [n.id, { x: n.x, y: n.y }]),
  );
  const edges = positioned
    .filter((n) => n.parent && positions[n.parent])
    .map((n) => ({ from: n.parent as string, to: n.id }));

  return { positioned, positions, edges, width, height };
}
