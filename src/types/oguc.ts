export type NodeType =
  | 'ACCESO_PRINCIPAL'
  | 'RESTROOM_ACCESSIBLE'
  | 'BEDROOM_ACCESSIBLE'
  | 'KITCHEN'
  | 'CIRCULATION_CORRIDOR'
  | 'LIVING_ROOM'
  | 'TERRACE'
  | 'OTHER';

export type ItemType =
  | 'SINK'
  | 'TOILET'
  | 'SHOWER'
  | 'GRAB_BAR'
  | 'SWITCH'
  | 'DOOR_HANDLE'
  | 'BED'
  | 'TABLE'
  | 'INTERCOM'
  | 'MIRROR'
  | 'OBSTACLE';

export interface Point2D {
  x: number;
  y: number;
}

export interface NodeDimensions {
  width_m: number;
  length_m: number;
}

export interface SpatialItem {
  item_id: string;
  label: string;
  type: ItemType;
  pos_x: number; // en metros
  pos_y: number;
  width?: number; // en metros
  depth?: number; // en metros
  z_installation: number; // cota Z de instalación en metros
  z_clearance_under?: number; // espacio libre inferior en metros
  is_operable?: boolean; // si es elemento de accionamiento manual
  rotation_deg?: number; // ángulo de rotación libre de 0° a 360°
}

export interface SpatialNode {
  node_id: string;
  label: string;
  type: NodeType;
  dimensions?: NodeDimensions; // ancho y largo en metros
  polygon_2d: Point2D[]; // vértices en metros
  height_z: number; // altura libre en metros
  items: SpatialItem[];
  calculatedArea?: number;
  centroid?: Point2D;
}

export interface SpatialEdge {
  edge_id: string;
  label?: string;
  connects: [string, string]; // [node_id_A, node_id_B]
  clear_width: number; // ancho libre de paso en metros
  position: Point2D; // coordenadas de posición
  rotation_deg?: number; // orientación vectorial de 0° a 360°
  swing_direction?: 'IN_A' | 'IN_B' | 'SLIDING' | 'DOUBLE';
  threshold_height?: number; // resalto en metros
}

export interface ProjectData {
  project_id: string;
  project_name: string;
  normative_framework: string; // 'OGUC_CHILE_TITULO2_CAP2'
  building_level: number;
  author: string;
  date: string;
  nodes: SpatialNode[];
  edges: SpatialEdge[];
}

export type ViolationSeverity = 'BLOCKING_ERROR' | 'WARNING' | 'INFO';

export type ViolationCode =
  | 'ERR_DOOR_WIDTH'
  | 'WARN_TURNING_RADIUS'
  | 'ERR_Z_INSTALLATION'
  | 'OGUC_ERR_ROOM_WITHOUT_DOOR'
  | 'OGUC_ERR_UNREACHABLE_NODE'
  | 'ERR_APPROACH_CLEARANCE'
  | 'ERR_UNDER_SINK_CLEARANCE'
  | 'ERR_THRESHOLD_HEIGHT';

export interface RuleViolation {
  id: string;
  code: ViolationCode;
  severity: ViolationSeverity;
  oguc_article: string;
  node_id?: string;
  edge_id?: string;
  item_id?: string;
  title: string;
  description: string;
  current_value: string | number;
  required_value: string | number;
  suggested_fix: string;
  target_coords?: Point2D;
}

export type NodeComplianceStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'ORPHAN';

export interface NodeEvaluation {
  node_id: string;
  status: NodeComplianceStatus;
  is_orphan: boolean;
  has_door: boolean;
  is_reachable_bfs: boolean;
  bfs_depth?: number;
  bfs_path?: string[];
  area_m2: number;
  r1_door_status: 'PASS' | 'FAIL' | 'NA';
  r2_turning_radius: 'PASS' | 'WARN' | 'NA';
  r2_circle_center?: Point2D;
  r2_radius_found?: number;
  r3_z_installation: 'PASS' | 'FAIL' | 'NA';
  r4_approach_space: 'PASS' | 'FAIL' | 'NA';
  violations: RuleViolation[];
}

export interface EdgeEvaluation {
  edge_id: string;
  is_traversable: boolean;
  clear_width: number;
  status: 'COMPLIANT' | 'NON_COMPLIANT';
  violations: RuleViolation[];
}

export interface DiagnosticResult {
  timestamp: string;
  compliance_percentage: number;
  total_nodes: number;
  compliant_nodes: number;
  warning_nodes: number;
  non_compliant_nodes: number;
  orphan_nodes: number;
  total_edges: number;
  total_items: number;
  node_evaluations: Record<string, NodeEvaluation>;
  edge_evaluations: Record<string, EdgeEvaluation>;
  violations: RuleViolation[];
  execution_logs: string[];
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  ACCESO_PRINCIPAL: 'Acceso Principal (Entrada)',
  RESTROOM_ACCESSIBLE: 'Baño Accesible Universal',
  BEDROOM_ACCESSIBLE: 'Dormitorio Accesible',
  KITCHEN: 'Cocina / Kitchenette',
  CIRCULATION_CORRIDOR: 'Pasillo de Circulación',
  LIVING_ROOM: 'Estar / Comedor',
  TERRACE: 'Terraza / Balcón',
  OTHER: 'Recinto General'
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  SINK: 'Lavamanos',
  TOILET: 'Inodoro (WC)',
  SHOWER: 'Ducha a Nivel',
  GRAB_BAR: 'Barra de Apoyo',
  SWITCH: 'Interruptor Eléctrico',
  DOOR_HANDLE: 'Manilla de Puerta',
  BED: 'Cama',
  TABLE: 'Mesa / Escritorio',
  INTERCOM: 'Citófono / Termostato',
  MIRROR: 'Espejo Inclinado',
  OBSTACLE: 'Mobiliario Fijo'
};
