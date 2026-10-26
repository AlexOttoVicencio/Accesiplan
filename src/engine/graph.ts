import { Point2D, SpatialNode, SpatialEdge, ProjectData } from '../types/oguc';

/**
 * Calcula el área de un polígono 2D mediante la fórmula de Gauss / Shoelace
 */
export function calculatePolygonArea(points: Point2D[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calcula el centroide geométrico cartesiano (Xc, Yc) de un polígono 2D
 */
export function calculateCentroid(points: Point2D[]): Point2D {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };
  if (points.length === 2) {
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  }

  let signedArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const factor = points[i].x * points[j].y - points[j].x * points[i].y;
    signedArea += factor;
    cx += (points[i].x + points[j].x) * factor;
    cy += (points[i].y + points[j].y) * factor;
  }

  signedArea *= 0.5;

  if (Math.abs(signedArea) < 1e-6) {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  cx = cx / (6 * signedArea);
  cy = cy / (6 * signedArea);

  return { x: cx, y: cy };
}

/**
 * Bounding Box de un polígono
 */
export function getPolygonBounds(points: Point2D[]) {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Ray-casting algorithm para punto dentro de polígono
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Distancia mínima de un punto a un segmento de línea
 */
export function distanceToSegment(p: Point2D, v: Point2D, w: Point2D): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

/**
 * Distancia mínima de un punto a los bordes de un polígono
 */
export function distanceToPolygonEdges(point: Point2D, polygon: Point2D[]): number {
  if (!polygon || polygon.length < 3) return 0;
  let minDist = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const d = distanceToSegment(point, polygon[i], polygon[j]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Busca si cabe un círculo de diámetro D = 1.50m (R = 0.75m) libre de muros y obstáculos en el recinto
 */
export function findTurningRadiusCircle(
  polygon: Point2D[],
  obstacles: { x: number; y: number; width: number; depth: number }[],
  targetRadius: number = 0.75
): { fits: boolean; center: Point2D; maxRadiusFound: number } {
  const bounds = getPolygonBounds(polygon);
  const centroid = calculateCentroid(polygon);

  if (bounds.width <= 0 || bounds.height <= 0) {
    return { fits: false, center: centroid, maxRadiusFound: 0 };
  }

  // Grid de muestreo fino en el recinto
  const step = 0.10; // muestreo cada 10 cm
  let bestCenter: Point2D = centroid;
  let maxClearance = 0;

  for (let x = bounds.minX + 0.1; x <= bounds.maxX - 0.1; x += step) {
    for (let y = bounds.minY + 0.1; y <= bounds.maxY - 0.1; y += step) {
      const candidate: Point2D = { x, y };
      if (!isPointInPolygon(candidate, polygon)) continue;

      // Distancia a muros
      let clearance = distanceToPolygonEdges(candidate, polygon);

      // Distancia a obstáculos fijos (bounding box de ítems)
      for (const obs of obstacles) {
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;
        const obsTop = obs.y;
        const obsBottom = obs.y + obs.depth;

        // Distancia euclidiana aproximada al rectángulo del obstáculo
        const dx = Math.max(obsLeft - candidate.x, 0, candidate.x - obsRight);
        const dy = Math.max(obsTop - candidate.y, 0, candidate.y - obsBottom);
        const distToObs = Math.hypot(dx, dy);

        if (distToObs < clearance) {
          clearance = distToObs;
        }
      }

      if (clearance > maxClearance) {
        maxClearance = clearance;
        bestCenter = candidate;
      }
    }
  }

  return {
    fits: maxClearance >= targetRadius - 0.02, // tolerancia 2cm
    center: bestCenter,
    maxRadiusFound: maxClearance
  };
}

export interface BFSResult {
  reachableMap: Map<string, { reachable: boolean; depth: number; path: string[] }>;
  traversableEdges: Set<string>;
  rootNodeId: string;
}

/**
 * Evaluación de Conectividad mediante Recorrido en Anchura (BFS)
 * desde el nodo 'ACCESO_PRINCIPAL'. Una arista sólo es transitable si clear_width >= 0.80 m.
 */
export function evaluateAccessibilityBFS(project: ProjectData): BFSResult {
  const reachableMap = new Map<string, { reachable: boolean; depth: number; path: string[] }>();
  const traversableEdges = new Set<string>();

  // Inicializar todos los nodos como no alcanzables
  for (const node of project.nodes) {
    reachableMap.set(node.node_id, { reachable: false, depth: -1, path: [] });
  }

  // Identificar nodo raíz (ACCESO_PRINCIPAL o el primer nodo existente)
  const rootNode = project.nodes.find(n => n.type === 'ACCESO_PRINCIPAL') || project.nodes[0];

  if (!rootNode) {
    return { reachableMap, traversableEdges, rootNodeId: '' };
  }

  const rootId = rootNode.node_id;

  // Filtrar aristas transitables (clear_width >= 0.80 m)
  for (const edge of project.edges) {
    if (edge.clear_width >= 0.80) {
      traversableEdges.add(edge.edge_id);
    }
  }

  // Construir mapa de adyacencia considerando solo aristas transitables
  const adj = new Map<string, Array<{ targetId: string; edgeId: string }>>();
  for (const node of project.nodes) {
    adj.set(node.node_id, []);
  }

  for (const edge of project.edges) {
    if (!traversableEdges.has(edge.edge_id)) continue;
    const [u, v] = edge.connects;
    if (adj.has(u)) adj.get(u)!.push({ targetId: v, edgeId: edge.edge_id });
    if (adj.has(v)) adj.get(v)!.push({ targetId: u, edgeId: edge.edge_id });
  }

  // Ejecución BFS
  const queue: Array<{ id: string; depth: number; path: string[] }> = [
    { id: rootId, depth: 0, path: [rootId] }
  ];
  reachableMap.set(rootId, { reachable: true, depth: 0, path: [rootId] });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current.id) || [];

    for (const neighbor of neighbors) {
      const state = reachableMap.get(neighbor.targetId);
      if (state && !state.reachable) {
        const newPath = [...current.path, neighbor.targetId];
        reachableMap.set(neighbor.targetId, {
          reachable: true,
          depth: current.depth + 1,
          path: newPath
        });
        queue.push({
          id: neighbor.targetId,
          depth: current.depth + 1,
          path: newPath
        });
      }
    }
  }

  return {
    reachableMap,
    traversableEdges,
    rootNodeId: rootId
  };
}
