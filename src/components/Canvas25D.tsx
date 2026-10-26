import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ProjectData,
  SpatialNode,
  SpatialEdge,
  SpatialItem,
  Point2D,
  DiagnosticResult,
  NodeComplianceStatus
} from '../types/oguc';
import { calculateCentroid, distanceToRotatedRectangle, isPointInPolygon } from '../engine/graph';

interface Canvas25DProps {
  project: ProjectData;
  diagnostics: DiagnosticResult;
  viewMode: '2D' | '2.5D';
  theme: 'dark' | 'light';
  selectedEntity: { type: 'node' | 'edge' | 'item' | null; id: string | null; subId?: string | null };
  onSelectEntity: (type: 'node' | 'edge' | 'item' | null, id: string | null, subId?: string | null) => void;
  onUpdateProject: (updated: ProjectData) => void;
  showTurningRadius: boolean;
  showTransferZones: boolean;
  showBfsPaths: boolean;
  showCotas: boolean;
  showZHeights: boolean;
  snapGrid: number; // en metros (ej 0.10)
  canvasRefCallback?: (ref: HTMLCanvasElement | null) => void;
}

export const Canvas25D: React.FC<Canvas25DProps> = ({
  project,
  diagnostics,
  viewMode,
  theme,
  selectedEntity,
  onSelectEntity,
  onUpdateProject,
  showTurningRadius,
  showTransferZones,
  showBfsPaths,
  showCotas,
  showZHeights,
  snapGrid,
  canvasRefCallback
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom
  const [scale, setScale] = useState<number>(65); // píxeles por metro
  const [offset, setOffset] = useState<Point2D>({ x: 140, y: 120 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });

  // Dragging Entities
  const [isDraggingEntity, setIsDraggingEntity] = useState<boolean>(false);
  const [dragStartWorld, setDragStartWorld] = useState<Point2D>({ x: 0, y: 0 });

  // Iso 2.5D angles
  const isoAngle = Math.PI / 6; // 30 degrees
  const cosIso = Math.cos(isoAngle);
  const sinIso = Math.sin(isoAngle);

  const isDark = theme === 'dark';

  // Registrar ref exterior para capturas PDF
  useEffect(() => {
    if (canvasRefCallback) {
      canvasRefCallback(canvasRef.current);
    }
  }, [canvasRefCallback]);

  // Conversión de coordenadas de mundo (metros) a pantalla (píxeles)
  const worldToScreen2D = useCallback((wx: number, wy: number): Point2D => {
    return {
      x: offset.x + wx * scale,
      y: offset.y + wy * scale
    };
  }, [offset, scale]);

  const screenToWorld2D = useCallback((sx: number, sy: number): Point2D => {
    return {
      x: (sx - offset.x) / scale,
      y: (sy - offset.y) / scale
    };
  }, [offset, scale]);

  // Proyección Isométrica 2.5D
  const worldToIsoScreen = useCallback((wx: number, wy: number, wz: number = 0): Point2D => {
    const isoX = (wx - wy) * cosIso;
    const isoY = (wx + wy) * sinIso - wz * 0.8;
    return {
      x: offset.x + 300 + isoX * scale,
      y: offset.y + 160 + isoY * scale
    };
  }, [offset, scale, cosIso, sinIso]);

  // Colores semánticos según estado OGUC
  const getStatusColor = (status: NodeComplianceStatus | string, alpha: number = 1): string => {
    switch (status) {
      case 'COMPLIANT':
        return `rgba(16, 185, 129, ${alpha})`; // #10B981 Emerald
      case 'WARNING':
        return `rgba(245, 158, 11, ${alpha})`; // #F59E0B Amber
      case 'NON_COMPLIANT':
      case 'ORPHAN':
        return `rgba(239, 68, 68, ${alpha})`; // #EF4444 Red
      default:
        return `rgba(56, 189, 248, ${alpha})`; // #38BDF8 Sky
    }
  };

  // Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo según tema
    ctx.fillStyle = isDark ? '#0B0F17' : '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Grilla Cartesiana Activa (Alto Contraste)
    renderGrid(ctx, canvas.width, canvas.height);

    if (viewMode === '2D') {
      render2D(ctx);
    } else {
      render25D(ctx);
    }
  }, [
    project,
    diagnostics,
    viewMode,
    theme,
    selectedEntity,
    scale,
    offset,
    showTurningRadius,
    showTransferZones,
    showBfsPaths,
    showCotas,
    showZHeights,
    isDark
  ]);

  useEffect(() => {
    render();
  }, [render]);

  // --- DIBUJO DE GRILLA ---
  const renderGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    const minorGrid = snapGrid * scale;
    const majorGrid = 1.0 * scale;

    // Grilla Menor
    ctx.strokeStyle = isDark ? '#151E2E' : '#E2E8F0';
    ctx.lineWidth = 1;
    const startX = offset.x % minorGrid;
    const startY = offset.y % minorGrid;

    ctx.beginPath();
    for (let x = startX; x < w; x += minorGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = startY; y < h; y += minorGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Grilla Mayor (1.0m)
    ctx.strokeStyle = isDark ? '#1E293B' : '#CBD5E1';
    ctx.lineWidth = 1.2;
    const majorStartX = offset.x % majorGrid;
    const majorStartY = offset.y % majorGrid;

    ctx.beginPath();
    for (let x = majorStartX; x < w; x += majorGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = majorStartY; y < h; y += majorGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Origen Cartesiano (0, 0)
    const origin = viewMode === '2D' ? worldToScreen2D(0, 0) : worldToIsoScreen(0, 0, 0);
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = isDark ? '#38BDF8' : '#0369A1';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('(0,0) m', origin.x + 8, origin.y - 8);

    ctx.restore();
  };

  // --- DIBUJO MODO 2D ---
  const render2D = (ctx: CanvasRenderingContext2D) => {
    // 1. Rutas BFS de Accesibilidad
    if (showBfsPaths) {
      renderBfsPathRibbons(ctx);
    }

    // 2. Nodos / Recintos
    project.nodes.forEach(node => {
      const evalData = diagnostics.node_evaluations[node.node_id];
      const status = evalData ? evalData.status : 'COMPLIANT';
      const isSelected = selectedEntity.type === 'node' && selectedEntity.id === node.node_id;

      ctx.save();
      // Relleno poligonal
      ctx.beginPath();
      node.polygon_2d.forEach((pt, idx) => {
        const scr = worldToScreen2D(pt.x, pt.y);
        if (idx === 0) ctx.moveTo(scr.x, scr.y);
        else ctx.lineTo(scr.x, scr.y);
      });
      ctx.closePath();

      // Color de fondo semántico
      ctx.fillStyle = isSelected
        ? (isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(14, 165, 233, 0.18)')
        : getStatusColor(status, isDark ? 0.12 : 0.08);
      ctx.fill();

      // Muro perimetral
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = isSelected
        ? '#0284C7'
        : getStatusColor(status, isDark ? 0.85 : 0.95);
      ctx.stroke();

      // Cotas de muro en 2D
      if (showCotas) {
        renderPolygonDimensions(ctx, node.polygon_2d);
      }

      // Vértices seleccionables
      if (isSelected) {
        node.polygon_2d.forEach((pt) => {
          const scr = worldToScreen2D(pt.x, pt.y);
          ctx.fillStyle = '#0284C7';
          ctx.fillRect(scr.x - 4, scr.y - 4, 8, 8);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(scr.x - 4, scr.y - 4, 8, 8);
        });
      }

      // Centroide y Etiqueta
      const centroid = node.centroid || calculateCentroid(node.polygon_2d);
      const cScr = worldToScreen2D(centroid.x, centroid.y);

      ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, cScr.x, cScr.y - 12);

      const dimText = node.dimensions
        ? `${node.dimensions.width_m.toFixed(2)}x${node.dimensions.length_m.toFixed(2)}m (${(node.calculatedArea || 0).toFixed(2)} m²)`
        : `${(node.calculatedArea || 0).toFixed(2)} m²`;

      ctx.fillStyle = isDark ? '#94A3B8' : '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(dimText, cScr.x, cScr.y + 4);

      // Badge de estado en recinto
      renderNodeStatusBadge(ctx, cScr.x, cScr.y + 20, status, evalData?.is_orphan, evalData?.has_door);

      // Capa R2: Radio de giro 1.50m
      if (showTurningRadius && evalData?.r2_circle_center) {
        renderTurningRadiusCircle(ctx, evalData.r2_circle_center, evalData.r2_turning_radius === 'PASS');
      }

      // 3. Ítems del recinto en 2D
      node.items?.forEach(item => {
        renderItem2D(ctx, node, item);
      });

      ctx.restore();
    });

    // 4. Aristas / Puertas en 2D con rotación vectorial (0° - 360°)
    project.edges.forEach(edge => {
      renderEdge2D(ctx, edge);
    });
  };

  // --- DIBUJO MODO 2.5D ISOMÉTRICO ---
  const render25D = (ctx: CanvasRenderingContext2D) => {
    const sortedNodes = [...project.nodes].sort((a, b) => {
      const centA = calculateCentroid(a.polygon_2d);
      const centB = calculateCentroid(b.polygon_2d);
      return (centA.x + centA.y) - (centB.x + centB.y);
    });

    sortedNodes.forEach(node => {
      const evalData = diagnostics.node_evaluations[node.node_id];
      const status = evalData ? evalData.status : 'COMPLIANT';
      const isSelected = selectedEntity.type === 'node' && selectedEntity.id === node.node_id;
      const wallH = node.height_z || 2.40;

      ctx.save();

      // 1. Losa de Piso Isométrica
      ctx.beginPath();
      node.polygon_2d.forEach((pt, idx) => {
        const scr = worldToIsoScreen(pt.x, pt.y, 0);
        if (idx === 0) ctx.moveTo(scr.x, scr.y);
        else ctx.lineTo(scr.x, scr.y);
      });
      ctx.closePath();
      ctx.fillStyle = isSelected
        ? 'rgba(56, 189, 248, 0.25)'
        : getStatusColor(status, isDark ? 0.20 : 0.14);
      ctx.fill();
      ctx.strokeStyle = getStatusColor(status, 0.9);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Capa de Radio de Giro en Piso Isométrico
      if (showTurningRadius && evalData?.r2_circle_center) {
        renderIsoTurningRadius(ctx, evalData.r2_circle_center, evalData.r2_turning_radius === 'PASS');
      }

      // 2. Extrusión de Muros Verticales en 2.5D
      for (let i = 0; i < node.polygon_2d.length; i++) {
        const p1 = node.polygon_2d[i];
        const p2 = node.polygon_2d[(i + 1) % node.polygon_2d.length];

        const b1 = worldToIsoScreen(p1.x, p1.y, 0);
        const b2 = worldToIsoScreen(p2.x, p2.y, 0);
        const t1 = worldToIsoScreen(p1.x, p1.y, wallH);
        const t2 = worldToIsoScreen(p2.x, p2.y, wallH);

        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.closePath();

        ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.40)' : 'rgba(226, 232, 240, 0.55)';
        ctx.fill();
        ctx.strokeStyle = isSelected
          ? 'rgba(56, 189, 248, 0.7)'
          : isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pilares en esquinas
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.strokeStyle = getStatusColor(status, 0.6);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 3. Artefactos con Volumen y Rotación 2.5D
      node.items?.forEach(item => {
        renderItem25D(ctx, node, item);
      });

      // Centroide y Título Elevado
      const centroid = node.centroid || calculateCentroid(node.polygon_2d);
      const isoTitle = worldToIsoScreen(centroid.x, centroid.y, wallH + 0.3);

      ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, isoTitle.x, isoTitle.y);

      ctx.fillStyle = isDark ? '#94A3B8' : '#475569';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`Z:${wallH.toFixed(2)}m`, isoTitle.x, isoTitle.y + 12);

      ctx.restore();
    });

    // 4. Puertas en 2.5D
    project.edges.forEach(edge => {
      renderEdge25D(ctx, edge);
    });
  };

  // --- RENDERIZADO DE ÍTEMS EN 2D (CON ROTACIÓN 0° A 360°) ---
  const renderItem2D = (ctx: CanvasRenderingContext2D, node: SpatialNode, item: SpatialItem) => {
    const isSelected = selectedEntity.type === 'item' && selectedEntity.id === item.item_id;
    const itemW = item.width || 0.50;
    const itemD = item.depth || 0.50;
    const rotDeg = item.rotation_deg || 0;
    const rotRad = (rotDeg * Math.PI) / 180;

    const centerX = item.pos_x + itemW / 2;
    const centerY = item.pos_y + itemD / 2;
    const cScr = worldToScreen2D(centerX, centerY);

    const wPx = itemW * scale;
    const dPx = itemD * scale;

    ctx.save();
    ctx.translate(cScr.x, cScr.y);
    ctx.rotate(rotRad);

    // Zona de Aproximación R4 (si es inodoro)
    if (showTransferZones && item.type === 'TOILET') {
      const transW = 0.80 * scale;
      const transD = 1.20 * scale;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.strokeStyle = '#10B981';
      ctx.setLineDash([4, 4]);
      ctx.fillRect(wPx / 2 + 2, -transD / 2, transW, transD);
      ctx.strokeRect(wPx / 2 + 2, -transD / 2, transW, transD);
      ctx.setLineDash([]);
    }

    // Dibujo del Artefacto
    ctx.fillStyle = isSelected
      ? '#0284C7'
      : isDark ? '#1E293B' : '#F1F5F9';
    ctx.strokeStyle = isSelected
      ? '#FFFFFF'
      : isDark ? '#64748B' : '#94A3B8';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    if (item.type === 'TOILET') {
      // Inodoro centrado
      ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx * 0.35); // Estanque posterior
      ctx.beginPath();
      ctx.ellipse(0, dPx * 0.15, wPx * 0.45, dPx * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'SINK') {
      // Lavamanos
      ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
      ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(wPx, dPx) * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#0F172A' : '#E2E8F0';
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'SWITCH' || item.type === 'INTERCOM') {
      // Interruptor / Citófono
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = item.z_installation > 1.20 || item.z_installation < 0.40 ? '#EF4444' : '#10B981';
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'GRAB_BAR') {
      // Barra de Apoyo orientada
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0284C7';
      ctx.beginPath();
      ctx.moveTo(-wPx / 2, 0);
      ctx.lineTo(wPx / 2, 0);
      ctx.stroke();
    } else {
      ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
      ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
    }

    // Indicador sutil de orientación frontal (pequeño punto o flecha)
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(0, -dPx / 2 + 3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Texto de Etiqueta y Cotas Z (sin rotar para máxima legibilidad)
    ctx.save();
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    const itemLabel = showCotas ? `${item.label || item.type} (${itemW.toFixed(2)}x${itemD.toFixed(2)}m)` : (item.label || item.type);
    ctx.fillText(itemLabel, cScr.x, cScr.y - dPx / 2 - 4);

    if (showZHeights) {
      const zColor = (item.is_operable || item.type === 'SWITCH' || item.type === 'SINK')
        && (item.z_installation < 0.40 || item.z_installation > 1.20)
        ? '#EF4444'
        : '#10B981';
      ctx.fillStyle = zColor;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`Z=${item.z_installation.toFixed(2)}m (${rotDeg}°)`, cScr.x, cScr.y + dPx / 2 + 11);
    }
    ctx.restore();
  };

  // --- RENDERIZADO DE ÍTEMS EN 2.5D ISOMÉTRICO (CON ROTACIÓN) ---
  const renderItem25D = (ctx: CanvasRenderingContext2D, node: SpatialNode, item: SpatialItem) => {
    const isSelected = selectedEntity.type === 'item' && selectedEntity.id === item.item_id;
    const w = item.width || 0.50;
    const d = item.depth || 0.50;
    const zBase = item.z_installation || 0.50;
    const rotRad = ((item.rotation_deg || 0) * Math.PI) / 180;

    const cx = item.pos_x + w / 2;
    const cy = item.pos_y + d / 2;

    // Calcular las 4 esquinas rotadas en coordenadas del mundo
    const corners = [
      { x: -w / 2, y: -d / 2 },
      { x: w / 2, y: -d / 2 },
      { x: w / 2, y: d / 2 },
      { x: -w / 2, y: d / 2 }
    ].map(pt => ({
      x: cx + pt.x * Math.cos(rotRad) - pt.y * Math.sin(rotRad),
      y: cy + pt.x * Math.sin(rotRad) + pt.y * Math.cos(rotRad)
    }));

    const topCorners = corners.map(c => worldToIsoScreen(c.x, c.y, zBase));
    const bottomCorners = corners.map(c => worldToIsoScreen(c.x, c.y, 0));

    ctx.save();

    // Línea de Cota Vertical Z
    if (showZHeights) {
      ctx.strokeStyle = item.z_installation < 0.40 || item.z_installation > 1.20 ? '#EF4444' : '#38BDF8';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(bottomCorners[0].x, bottomCorners[0].y);
      ctx.lineTo(topCorners[0].x, topCorners[0].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Cara superior del ítem rotado
    ctx.beginPath();
    topCorners.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();

    ctx.fillStyle = isSelected
      ? '#0284C7'
      : isDark ? '#334155' : '#CBD5E1';
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  // --- RENDERIZADO DE PUERTAS EN 2D (CON ROTACIÓN 0° A 360°) ---
  const renderEdge2D = (ctx: CanvasRenderingContext2D, edge: SpatialEdge) => {
    const isSelected = selectedEntity.type === 'edge' && selectedEntity.id === edge.edge_id;
    const isCompliant = edge.clear_width >= 0.80;
    const p = worldToScreen2D(edge.position.x, edge.position.y);
    const wPx = edge.clear_width * scale;
    const rotRad = ((edge.rotation_deg || 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(rotRad);

    // Vano / Umbral
    ctx.fillStyle = isDark ? '#0F172A' : '#E2E8F0';
    ctx.fillRect(-wPx / 2, -3, wPx, 6);

    // Hoja de Puerta
    ctx.strokeStyle = isSelected ? '#0284C7' : isCompliant ? '#10B981' : '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-wPx / 2, 0);
    ctx.lineTo(wPx / 2, 0);
    ctx.stroke();

    // Arco de abatimiento
    ctx.strokeStyle = isCompliant ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(-wPx / 2, 0, wPx, 0, Math.PI / 2, false);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // Etiqueta de Ancho Libre (horizontal)
    ctx.save();
    ctx.fillStyle = isCompliant ? '#10B981' : '#EF4444';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${edge.clear_width.toFixed(2)}m (${edge.rotation_deg || 0}°)`, p.x, p.y - 10);
    ctx.restore();
  };

  // --- RENDERIZADO DE PUERTAS EN 2.5D ---
  const renderEdge25D = (ctx: CanvasRenderingContext2D, edge: SpatialEdge) => {
    const isCompliant = edge.clear_width >= 0.80;
    const p = worldToIsoScreen(edge.position.x, edge.position.y, 0);
    const pTop = worldToIsoScreen(edge.position.x, edge.position.y, 2.10);

    ctx.save();
    ctx.strokeStyle = isCompliant ? '#10B981' : '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(pTop.x, pTop.y);
    ctx.stroke();

    ctx.fillStyle = isCompliant ? '#10B981' : '#EF4444';
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.fillText(`${edge.clear_width.toFixed(2)}m`, p.x + 6, p.y - 8);
    ctx.restore();
  };

  // --- CÍRCULO DE GIRO 1.50M ---
  const renderTurningRadiusCircle = (ctx: CanvasRenderingContext2D, center: Point2D, fits: boolean) => {
    const scr = worldToScreen2D(center.x, center.y);
    const rPx = 0.75 * scale;

    ctx.save();
    ctx.fillStyle = fits ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.18)';
    ctx.strokeStyle = fits ? '#10B981' : '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.arc(scr.x, scr.y, rPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = fits ? '#10B981' : '#F59E0B';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Ø 1.50 m (OGUC)', scr.x, scr.y + 3);

    ctx.restore();
  };

  const renderIsoTurningRadius = (ctx: CanvasRenderingContext2D, center: Point2D, fits: boolean) => {
    const r = 0.75;
    ctx.save();
    ctx.fillStyle = fits ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.20)';
    ctx.strokeStyle = fits ? '#10B981' : '#F59E0B';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let angle = 0; angle <= Math.PI * 2; angle += 0.2) {
      const wx = center.x + r * Math.cos(angle);
      const wy = center.y + r * Math.sin(angle);
      const p = worldToIsoScreen(wx, wy, 0);
      if (angle === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  // --- COTAS DE POLÍGONOS ---
  const renderPolygonDimensions = (ctx: CanvasRenderingContext2D, points: Point2D[]) => {
    ctx.save();
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = isDark ? '#64748B' : '#475569';
    ctx.textAlign = 'center';

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      const midW = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const midScr = worldToScreen2D(midW.x, midW.y);

      ctx.fillText(`${dist.toFixed(2)}m`, midScr.x, midScr.y - 4);
    }
    ctx.restore();
  };

  // --- RIBBONS DE FLUJO BFS ---
  const renderBfsPathRibbons = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);

    project.edges.forEach(edge => {
      const [uId, vId] = edge.connects;
      const nodeA = project.nodes.find(n => n.node_id === uId);
      const nodeB = project.nodes.find(n => n.node_id === vId);

      if (nodeA && nodeB) {
        const centA = nodeA.centroid || calculateCentroid(nodeA.polygon_2d);
        const centB = nodeB.centroid || calculateCentroid(nodeB.polygon_2d);

        const scrA = worldToScreen2D(centA.x, centA.y);
        const scrB = worldToScreen2D(centB.x, centB.y);

        const isTraversable = edge.clear_width >= 0.80;
        ctx.strokeStyle = isTraversable ? '#10B981' : '#EF4444';

        ctx.beginPath();
        ctx.moveTo(scrA.x, scrA.y);
        ctx.lineTo(scrB.x, scrB.y);
        ctx.stroke();
      }
    });

    ctx.restore();
  };

  // --- BADGE DE ESTADO DE NODO ---
  const renderNodeStatusBadge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    status: NodeComplianceStatus | string,
    isOrphan?: boolean,
    hasDoor?: boolean
  ) => {
    ctx.save();
    let text = 'CONFORME';
    let bg = '#10B981';

    if (hasDoor === false) {
      text = 'SIN PUERTA ASIGNADA';
      bg = '#EF4444';
    } else if (isOrphan) {
      text = 'AISLADO (HUÉRFANO)';
      bg = '#EF4444';
    } else if (status === 'NON_COMPLIANT') {
      text = 'NO CONFORME';
      bg = '#EF4444';
    } else if (status === 'WARNING') {
      text = 'ADVERTENCIA';
      bg = '#F59E0B';
    }

    ctx.font = 'bold 8px Inter, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const pad = 6;

    ctx.fillStyle = bg;
    ctx.fillRect(x - textWidth / 2 - pad, y - 8, textWidth + pad * 2, 14);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 2);
    ctx.restore();
  };

  // --- GESTIÓN DE EVENTOS DE RATÓN ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseScr = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const mouseWorld = screenToWorld2D(mouseScr.x, mouseScr.y);

    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart(mouseScr);
      return;
    }

    // 1. Clic en Ítems (soportando OBB rotado)
    for (const node of project.nodes) {
      for (const item of (node.items || [])) {
        const itemW = item.width || 0.50;
        const itemD = item.depth || 0.50;
        const dist = distanceToRotatedRectangle(mouseWorld, {
          x: item.pos_x,
          y: item.pos_y,
          width: itemW,
          depth: itemD,
          rotation_deg: item.rotation_deg || 0
        });

        if (dist <= 0.15) {
          onSelectEntity('item', item.item_id, node.node_id);
          setIsDraggingEntity(true);
          setDragStartWorld(mouseWorld);
          return;
        }
      }
    }

    // 2. Clic en Puertas / Aristas
    for (const edge of project.edges) {
      const dist = Math.hypot(mouseWorld.x - edge.position.x, mouseWorld.y - edge.position.y);
      if (dist <= 0.40) {
        onSelectEntity('edge', edge.edge_id);
        setIsDraggingEntity(true);
        setDragStartWorld(mouseWorld);
        return;
      }
    }

    // 3. Clic en Nodos / Recintos
    for (const node of project.nodes) {
      if (isPointInPolygon(mouseWorld, node.polygon_2d)) {
        onSelectEntity('node', node.node_id);
        setIsDraggingEntity(true);
        setDragStartWorld(mouseWorld);
        return;
      }
    }

    onSelectEntity(null, null);
    setIsPanning(true);
    setPanStart(mouseScr);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseScr = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (isPanning) {
      const dx = mouseScr.x - panStart.x;
      const dy = mouseScr.y - panStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart(mouseScr);
      return;
    }

    if (isDraggingEntity && selectedEntity.id) {
      const mouseWorld = screenToWorld2D(mouseScr.x, mouseScr.y);
      const rawDx = mouseWorld.x - dragStartWorld.x;
      const rawDy = mouseWorld.y - dragStartWorld.y;

      const snap = (v: number) => Math.round(v / snapGrid) * snapGrid;
      const dx = snap(rawDx);
      const dy = snap(rawDy);

      if (dx === 0 && dy === 0) return;

      if (selectedEntity.type === 'node') {
        const updatedNodes = project.nodes.map(n => {
          if (n.node_id === selectedEntity.id) {
            return {
              ...n,
              polygon_2d: n.polygon_2d.map(p => ({
                x: Number((p.x + dx).toFixed(2)),
                y: Number((p.y + dy).toFixed(2))
              })),
              items: (n.items || []).map(itm => ({
                ...itm,
                pos_x: Number((itm.pos_x + dx).toFixed(2)),
                pos_y: Number((itm.pos_y + dy).toFixed(2))
              }))
            };
          }
          return n;
        });
        onUpdateProject({ ...project, nodes: updatedNodes });
        setDragStartWorld(mouseWorld);
      } else if (selectedEntity.type === 'item') {
        const updatedNodes = project.nodes.map(n => {
          return {
            ...n,
            items: (n.items || []).map(itm => {
              if (itm.item_id === selectedEntity.id) {
                return {
                  ...itm,
                  pos_x: Number((itm.pos_x + dx).toFixed(2)),
                  pos_y: Number((itm.pos_y + dy).toFixed(2))
                };
              }
              return itm;
            })
          };
        });
        onUpdateProject({ ...project, nodes: updatedNodes });
        setDragStartWorld(mouseWorld);
      } else if (selectedEntity.type === 'edge') {
        const updatedEdges = project.edges.map(ed => {
          if (ed.edge_id === selectedEntity.id) {
            return {
              ...ed,
              position: {
                x: Number((ed.position.x + dx).toFixed(2)),
                y: Number((ed.position.y + dy).toFixed(2))
              }
            };
          }
          return ed;
        });
        onUpdateProject({ ...project, edges: updatedEdges });
        setDragStartWorld(mouseWorld);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingEntity(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = Math.min(Math.max(scale * zoomFactor, 20), 200);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${isDark ? 'bg-[#0B0F17]' : 'bg-[#F8FAFC]'}`}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair block"
      />

      <div className={`absolute bottom-4 left-4 backdrop-blur border rounded-lg px-3 py-1.5 flex items-center space-x-3 text-xs font-mono shadow-md ${
        isDark ? 'bg-slate-900/90 border-slate-700/80 text-slate-300' : 'bg-white/90 border-slate-300 text-slate-700'
      }`}>
        <span>Zoom: {Math.round((scale / 65) * 100)}%</span>
        <span className="opacity-40">|</span>
        <span>Snap: {snapGrid}m</span>
        <span className="opacity-40">|</span>
        <button
          onClick={() => {
            setScale(65);
            setOffset({ x: 140, y: 120 });
          }}
          className="text-sky-500 hover:underline"
        >
          Reset Vista
        </button>
      </div>
    </div>
  );
};
