import {
  SpatialNode,
  SpatialEdge,
  SpatialItem,
  RuleViolation,
  Point2D,
  ITEM_TYPE_LABELS
} from '../types/oguc';
import { findTurningRadiusCircle, getPolygonBounds, RotatedObstacle } from './graph';

/**
 * Regla R1 - Ancho de Puerta (OGUC Art. 2.2.8 / 4.1.7)
 * El ancho libre de paso (clear_width) debe ser mayor o igual a 0.80 m.
 */
export function evaluateR1_DoorWidth(edge: SpatialEdge): RuleViolation | null {
  const MIN_DOOR_WIDTH = 0.80;
  if (edge.clear_width < MIN_DOOR_WIDTH) {
    return {
      id: `viol_r1_${edge.edge_id}`,
      code: 'ERR_DOOR_WIDTH',
      severity: 'BLOCKING_ERROR',
      oguc_article: 'OGUC Art. 2.2.8 / D.S. 50 Art. 4.1.7',
      edge_id: edge.edge_id,
      title: 'Ancho Libre de Puerta Insuficiente',
      description: `El vano libre de paso de la puerta '${edge.label || edge.edge_id}' es de ${edge.clear_width.toFixed(2)} m. La norma exige un ancho libre mínimo de 0.80 m para permitir el paso expedito de usuarios en silla de ruedas.`,
      current_value: `${edge.clear_width.toFixed(2)} m`,
      required_value: '>= 0.80 m',
      suggested_fix: 'Ampliar el vano libre de la puerta a un mínimo de 0.80 m (recomendado 0.85 m - 0.90 m).',
      target_coords: edge.position
    };
  }
  return null;
}

/**
 * Regla R2 - Radio de Giro Avanzado con Artefactos Rotados (OGUC Art. 2.2.8 / D.S. 50)
 * Inserción de un círculo con diámetro D = 1.50 m (R = 0.75 m) en el plano 2D de recintos clave.
 * Colisión extendida: evalúa la intersección con muros perimetrales y con el polígono/bounding box
 * de todos los ítems y artefactos internos rotados según su rotation_deg (0° a 360°).
 */
export function evaluateR2_TurningRadius(
  node: SpatialNode
): { violation: RuleViolation | null; center: Point2D; radiusFound: number; required: boolean } {
  // Recintos donde la norma exige radio de giro obligatorio
  const requiresTurningRadius = [
    'RESTROOM_ACCESSIBLE',
    'ACCESO_PRINCIPAL',
    'BEDROOM_ACCESSIBLE',
    'KITCHEN',
    'LIVING_ROOM'
  ].includes(node.type);

  if (!requiresTurningRadius) {
    return {
      violation: null,
      center: { x: 0, y: 0 },
      radiusFound: 0,
      required: false
    };
  }

  // Extraer obstáculos internos con sus dimensiones y rotación exacta
  const floorObstacles: RotatedObstacle[] = (node.items || [])
    .filter(itm => ['TOILET', 'SINK', 'SHOWER', 'BED', 'TABLE', 'OBSTACLE'].includes(itm.type))
    .map(itm => ({
      x: itm.pos_x,
      y: itm.pos_y,
      width: itm.width || 0.50,
      depth: itm.depth || 0.50,
      rotation_deg: itm.rotation_deg || 0
    }));

  const targetRadius = 0.75; // D = 1.50 m
  const result = findTurningRadiusCircle(node.polygon_2d, floorObstacles, targetRadius);

  if (!result.fits) {
    const foundDiam = (result.maxRadiusFound * 2).toFixed(2);
    const violation: RuleViolation = {
      id: `viol_r2_${node.node_id}`,
      code: 'WARN_TURNING_RADIUS',
      severity: 'WARNING',
      oguc_article: 'OGUC D.S. 50 Art. 2.2.8',
      node_id: node.node_id,
      title: 'Radio de Giro D=1.50 m Insuficiente o Bloqueado por Artefactos',
      description: `El recinto '${node.label}' no dispone de un círculo libre de giro de diámetro 1.50 m libre de muros e ítems rotados. El diámetro libre máximo encontrado es de ${foundDiam} m.`,
      current_value: `D = ${foundDiam} m`,
      required_value: 'D >= 1.50 m',
      suggested_fix: 'Reubicar o rotar artefactos o ampliar las dimensiones del recinto para habilitar un círculo libre de rotación de 1.50 m.',
      target_coords: result.center
    };
    return { violation, center: result.center, radiusFound: result.maxRadiusFound, required: true };
  }

  return { violation: null, center: result.center, radiusFound: result.maxRadiusFound, required: true };
}

/**
 * Regla R3 - Cota Vertical Z (Alcance Manual) (OGUC Art. 4.1.7)
 * Para elementos operables (interruptores, manillas, grifería, citófonos), verificar 0.40 m <= Z_installation <= 1.20 m.
 * Para lavamanos: Z_installation <= 0.85 m y Z_clearance_under >= 0.70 m.
 */
export function evaluateR3_VerticalZ(node: SpatialNode, item: SpatialItem): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const itemLabel = item.label || ITEM_TYPE_LABELS[item.type] || item.type;

  const isOperable = item.is_operable || ['SWITCH', 'DOOR_HANDLE', 'INTERCOM', 'GRAB_BAR', 'SINK'].includes(item.type);

  if (isOperable) {
    const MIN_Z = 0.40;
    const MAX_Z = 1.20;

    if (item.z_installation < MIN_Z || item.z_installation > MAX_Z) {
      violations.push({
        id: `viol_r3_reach_${item.item_id}`,
        code: 'ERR_Z_INSTALLATION',
        severity: 'BLOCKING_ERROR',
        oguc_article: 'OGUC D.S. 50 Art. 4.1.7',
        node_id: node.node_id,
        item_id: item.item_id,
        title: `Cota de Alcance Manual Z Fuera de Norma (${itemLabel})`,
        description: `El elemento operable '${itemLabel}' se encuentra instalado a una cota Z = ${item.z_installation.toFixed(2)} m. La franja de alcance manual accesible según OGUC debe estar entre 0.40 m y 1.20 m.`,
        current_value: `Z = ${item.z_installation.toFixed(2)} m`,
        required_value: '0.40 m <= Z <= 1.20 m (Recomendado 0.90 m - 1.00 m)',
        suggested_fix: 'Ajustar la cota de instalación Z del elemento dentro del rango ergonómico de 0.40 m a 1.20 m.',
        target_coords: { x: item.pos_x, y: item.pos_y }
      });
    }
  }

  // Verificación específica para lavamanos accesible
  if (item.type === 'SINK') {
    const MIN_CLEAR_UNDER = 0.70;
    const clearUnder = item.z_clearance_under !== undefined ? item.z_clearance_under : (item.z_installation - 0.15);

    if (clearUnder < MIN_CLEAR_UNDER) {
      violations.push({
        id: `viol_r3_sink_${item.item_id}`,
        code: 'ERR_UNDER_SINK_CLEARANCE',
        severity: 'BLOCKING_ERROR',
        oguc_article: 'OGUC D.S. 50 Art. 4.1.7 / 2.2.8',
        node_id: node.node_id,
        item_id: item.item_id,
        title: 'Espacio Libre Inferior para Rodillas Insuficiente en Lavamanos',
        description: `El espacio libre bajo el lavamanos '${itemLabel}' es de ${clearUnder.toFixed(2)} m. La norma exige un mínimo de 0.70 m para permitir la aproximación frontal de usuarios en silla de ruedas.`,
        current_value: `Z_libre = ${clearUnder.toFixed(2)} m`,
        required_value: '>= 0.70 m',
        suggested_fix: 'Elevar la altura de la cubierta o retirar muebles inferiores para garantizar 0.70 m libres.',
        target_coords: { x: item.pos_x, y: item.pos_y }
      });
    }
  }

  return violations;
}

/**
 * Regla R4 - Espacio de Aproximación y Transferencia (OGUC Art. 2.2.8)
 * Verificación de área despejada en piso de 0.80 m x 1.20 m adyacente a inodoros (transferencia lateral) o camas.
 */
export function evaluateR4_ApproachSpace(node: SpatialNode, item: SpatialItem): RuleViolation | null {
  if (item.type === 'TOILET') {
    const bounds = getPolygonBounds(node.polygon_2d);
    const itemWidth = item.width || 0.45;
    const itemDepth = item.depth || 0.70;

    // Distancia al borde lateral izquierdo y derecho del recinto
    const distLeft = item.pos_x - bounds.minX;
    const distRight = bounds.maxX - (item.pos_x + itemWidth);

    // Se requiere al menos un lado con >= 0.80 m libre de aproximación lateral
    const hasLateralTransfer = distLeft >= 0.80 || distRight >= 0.80;

    if (!hasLateralTransfer) {
      return {
        id: `viol_r4_toilet_${item.item_id}`,
        code: 'ERR_APPROACH_CLEARANCE',
        severity: 'BLOCKING_ERROR',
        oguc_article: 'OGUC D.S. 50 Art. 2.2.8',
        node_id: node.node_id,
        item_id: item.item_id,
        title: 'Espacio de Transferencia Lateral Insuficiente en Inodoro',
        description: `El inodoro '${item.label || 'Inodoro'}' no cuenta con un espacio libre lateral de al menos 0.80 m x 1.20 m para la transferencia desde silla de ruedas (Izquierda: ${distLeft.toFixed(2)} m, Derecha: ${distRight.toFixed(2)} m).`,
        current_value: `Máx lateral = ${Math.max(distLeft, distRight).toFixed(2)} m`,
        required_value: '>= 0.80 m lateral libre',
        suggested_fix: 'Desplazar el inodoro al menos a 0.80 m del muro o artefacto lateral adyacente.',
        target_coords: { x: item.pos_x, y: item.pos_y }
      };
    }
  }

  return null;
}
