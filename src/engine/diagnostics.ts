import {
  ProjectData,
  DiagnosticResult,
  NodeEvaluation,
  EdgeEvaluation,
  RuleViolation,
  SpatialNode
} from '../types/oguc';
import {
  calculatePolygonArea,
  calculateCentroid,
  evaluateAccessibilityBFS
} from './graph';
import {
  evaluateR1_DoorWidth,
  evaluateR2_TurningRadius,
  evaluateR3_VerticalZ,
  evaluateR4_ApproachSpace
} from './rules';

/**
 * Motor Principal de Diagnóstico Normativo OGUC
 * Ejecuta el análisis topológico, reglas R1-R4, manejo de bifurcaciones y cálculo de cumplimiento.
 */
export function runDiagnostics(project: ProjectData): DiagnosticResult {
  const timestamp = new Date().toISOString();
  const logs: string[] = [];
  logs.push(`[SYS] Iniciando motor de diagnóstico normativo OGUC para '${project.project_name}'`);
  logs.push(`[INFO] Nodos a evaluar: ${project.nodes.length}, Aristas: ${project.edges.length}`);

  const nodeEvaluations: Record<string, NodeEvaluation> = {};
  const edgeEvaluations: Record<string, EdgeEvaluation> = {};
  const allViolations: RuleViolation[] = [];

  // 1. Evaluación de Conectividad Topológica (BFS desde ACCESO_PRINCIPAL)
  const bfsResult = evaluateAccessibilityBFS(project);
  logs.push(`[BFS] Recorrido de accesibilidad completado. Raíz: '${bfsResult.rootNodeId || 'N/A'}'`);

  // 2. Evaluación de Aristas (Puertas y Conectores)
  for (const edge of project.edges) {
    const edgeViolations: RuleViolation[] = [];
    const r1Violation = evaluateR1_DoorWidth(edge);
    if (r1Violation) {
      edgeViolations.push(r1Violation);
      allViolations.push(r1Violation);
      logs.push(`[R1 FAIL] Puerta '${edge.label || edge.edge_id}' ancho ${edge.clear_width.toFixed(2)}m < 0.80m`);
    }

    const isTraversable = edge.clear_width >= 0.80;
    edgeEvaluations[edge.edge_id] = {
      edge_id: edge.edge_id,
      is_traversable: isTraversable,
      clear_width: edge.clear_width,
      status: isTraversable ? 'COMPLIANT' : 'NON_COMPLIANT',
      violations: edgeViolations
    };
  }

  // 3. Evaluación de Nodos (Recintos)
  let compliantCount = 0;
  let warningCount = 0;
  let nonCompliantCount = 0;
  let orphanCount = 0;
  let totalItemsCount = 0;

  for (const node of project.nodes) {
    const nodeViolations: RuleViolation[] = [];
    const area = calculatePolygonArea(node.polygon_2d);
    node.calculatedArea = area;
    node.centroid = calculateCentroid(node.polygon_2d);
    totalItemsCount += (node.items || []).length;

    // Estado BFS y Detección de Nodo Huérfano (Bifurcación 1)
    const bfsState = bfsResult.reachableMap.get(node.node_id);
    const isReachable = bfsState ? bfsState.reachable : false;
    const isOrphan = !isReachable && node.type !== 'ACCESO_PRINCIPAL';

    if (isOrphan) {
      const orphanViolation: RuleViolation = {
        id: `viol_orphan_${node.node_id}`,
        code: 'OGUC_ERR_UNREACHABLE_NODE',
        severity: 'BLOCKING_ERROR',
        oguc_article: 'OGUC Art. 2.2.8 (Red de Circulación Accesible)',
        node_id: node.node_id,
        title: 'Recinto Aislado de la Red de Circulación Accesible',
        description: `El recinto '${node.label}' no tiene una ruta continua accesible desde el Acceso Principal. Las puertas de acceso no existen o su ancho libre es inferior a 0.80 m.`,
        current_value: 'Sin conexión accesible',
        required_value: 'Ruta continua >= 0.80 m',
        suggested_fix: 'Conectar el recinto con una puerta transitable (clear_width >= 0.80 m) hacia un pasillo o recinto conectado.',
        target_coords: node.centroid
      };
      nodeViolations.push(orphanViolation);
      allViolations.push(orphanViolation);
      logs.push(`[TOPOLOGY ERROR] Nodo '${node.label}' detectado como HUÉRFANO / AISLADO`);
    }

    // Puertas incidentes al nodo
    const incidentEdges = project.edges.filter(
      e => e.connects[0] === node.node_id || e.connects[1] === node.node_id
    );
    const hasDoorFailure = incidentEdges.some(e => e.clear_width < 0.80);
    const r1Status = incidentEdges.length === 0 ? 'NA' : hasDoorFailure ? 'FAIL' : 'PASS';

    // R2 - Radio de Giro en Piso
    const r2Result = evaluateR2_TurningRadius(node);
    let r2Status: 'PASS' | 'WARN' | 'NA' = 'NA';
    if (r2Result.required) {
      if (r2Result.violation) {
        r2Status = 'WARN';
        nodeViolations.push(r2Result.violation);
        allViolations.push(r2Result.violation);
        logs.push(`[R2 WARN] Recinto '${node.label}' radio de giro insuficiente (${(r2Result.radiusFound * 2).toFixed(2)}m < 1.50m)`);
      } else {
        r2Status = 'PASS';
      }
    }

    // R3 - Cota Vertical Z para elementos
    let hasR3Failure = false;
    for (const item of (node.items || [])) {
      const r3Violations = evaluateR3_VerticalZ(node, item);
      if (r3Violations.length > 0) {
        hasR3Failure = true;
        for (const v of r3Violations) {
          nodeViolations.push(v);
          allViolations.push(v);
          logs.push(`[R3 ERROR] Ítem '${item.label || item.type}' en '${node.label}' Z=${item.z_installation}m fuera de rango`);
        }
      }
    }
    const r3Status = (node.items || []).length === 0 ? 'NA' : hasR3Failure ? 'FAIL' : 'PASS';

    // R4 - Espacio de Transferencia y Aproximación
    let hasR4Failure = false;
    for (const item of (node.items || [])) {
      const r4Violation = evaluateR4_ApproachSpace(node, item);
      if (r4Violation) {
        hasR4Failure = true;
        nodeViolations.push(r4Violation);
        allViolations.push(r4Violation);
        logs.push(`[R4 ERROR] Inodoro en '${node.label}' sin espacio lateral de 0.80m`);
      }
    }
    const r4Status = (node.items || []).some(i => i.type === 'TOILET' || i.type === 'BED')
      ? (hasR4Failure ? 'FAIL' : 'PASS')
      : 'NA';

    // Determinación del Estado Global del Nodo (con Manejo de Bifurcaciones 1 y 2)
    let nodeStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'ORPHAN' = 'COMPLIANT';

    const hasBlockingErrors = nodeViolations.some(v => v.severity === 'BLOCKING_ERROR');
    const hasWarnings = nodeViolations.some(v => v.severity === 'WARNING');

    if (isOrphan) {
      nodeStatus = 'ORPHAN';
      orphanCount++;
      nonCompliantCount++;
    } else if (hasBlockingErrors || hasR3Failure) {
      // Bifurcación 2: Infracción Vertical Z Prioritaria sobreescribe estado conforme 2D
      nodeStatus = 'NON_COMPLIANT';
      nonCompliantCount++;
    } else if (hasWarnings) {
      nodeStatus = 'WARNING';
      warningCount++;
      compliantCount++; // Cumple base con advertencias de ergonomía
    } else {
      nodeStatus = 'COMPLIANT';
      compliantCount++;
    }

    nodeEvaluations[node.node_id] = {
      node_id: node.node_id,
      status: nodeStatus,
      is_orphan: isOrphan,
      is_reachable_bfs: isReachable,
      bfs_depth: bfsState?.depth,
      bfs_path: bfsState?.path,
      area_m2: Number(area.toFixed(2)),
      r1_door_status: r1Status,
      r2_turning_radius: r2Status,
      r2_circle_center: r2Result.center,
      r2_radius_found: r2Result.radiusFound,
      r3_z_installation: r3Status,
      r4_approach_space: r4Status,
      violations: nodeViolations
    };
  }

  // 4. Cálculo de Porcentaje de Cumplimiento Normativo
  const totalNodes = project.nodes.length;
  // Solo se consideran 100% conformes aquellos sin errores bloqueantes y no huérfanos
  const strictlyCompliantNodes = Object.values(nodeEvaluations).filter(
    n => n.status === 'COMPLIANT'
  ).length;

  const compliancePercentage = totalNodes > 0
    ? Math.round((strictlyCompliantNodes / totalNodes) * 100)
    : 0;

  logs.push(`[RESULT] Diagnóstico finalizado. Cumplimiento global: ${compliancePercentage}% (${strictlyCompliantNodes}/${totalNodes} recintos conformes)`);

  return {
    timestamp,
    compliance_percentage: compliancePercentage,
    total_nodes: totalNodes,
    compliant_nodes: strictlyCompliantNodes,
    warning_nodes: warningCount,
    non_compliant_nodes: nonCompliantCount,
    orphan_nodes: orphanCount,
    total_edges: project.edges.length,
    total_items: totalItemsCount,
    node_evaluations: nodeEvaluations,
    edge_evaluations: edgeEvaluations,
    violations: allViolations,
    execution_logs: logs
  };
}
