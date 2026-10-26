import React from 'react';
import {
  ProjectData,
  SpatialNode,
  SpatialEdge,
  SpatialItem,
  NodeType,
  ItemType,
  DiagnosticResult,
  NODE_TYPE_LABELS,
  ITEM_TYPE_LABELS
} from '../types/oguc';
import { generatePolygonFromDimensions, getPolygonBounds } from '../engine/graph';
import { Trash2, Plus, ShieldCheck, AlertTriangle, XCircle, Compass, RotateCw } from 'lucide-react';

interface InspectorProps {
  project: ProjectData;
  diagnostics: DiagnosticResult;
  theme: 'dark' | 'light';
  selectedEntity: { type: 'node' | 'edge' | 'item' | null; id: string | null; subId?: string | null };
  onSelectEntity: (type: 'node' | 'edge' | 'item' | null, id: string | null, subId?: string | null) => void;
  onUpdateProject: (updated: ProjectData) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  project,
  diagnostics,
  theme,
  selectedEntity,
  onSelectEntity,
  onUpdateProject
}) => {
  const isDark = theme === 'dark';

  const selectedNode = selectedEntity.type === 'node'
    ? project.nodes.find(n => n.node_id === selectedEntity.id)
    : null;

  const selectedEdge = selectedEntity.type === 'edge'
    ? project.edges.find(e => e.edge_id === selectedEntity.id)
    : null;

  let selectedItem: SpatialItem | null = null;
  let parentNodeOfItem: SpatialNode | null = null;

  if (selectedEntity.type === 'item') {
    for (const node of project.nodes) {
      const itm = (node.items || []).find(i => i.item_id === selectedEntity.id);
      if (itm) {
        selectedItem = itm;
        parentNodeOfItem = node;
        break;
      }
    }
  }

  const updateNode = (updated: SpatialNode) => {
    onUpdateProject({
      ...project,
      nodes: project.nodes.map(n => n.node_id === updated.node_id ? updated : n)
    });
  };

  const updateRoomDimensions = (node: SpatialNode, newW: number, newL: number) => {
    const originX = node.polygon_2d[0]?.x ?? 0;
    const originY = node.polygon_2d[0]?.y ?? 0;
    const newPoly = generatePolygonFromDimensions(originX, originY, newW, newL);

    updateNode({
      ...node,
      dimensions: { width_m: newW, length_m: newL },
      polygon_2d: newPoly
    });
  };

  const deleteNode = (nodeId: string) => {
    onUpdateProject({
      ...project,
      nodes: project.nodes.filter(n => n.node_id !== nodeId),
      edges: project.edges.filter(e => e.connects[0] !== nodeId && e.connects[1] !== nodeId)
    });
    onSelectEntity(null, null);
  };

  const updateEdge = (updated: SpatialEdge) => {
    onUpdateProject({
      ...project,
      edges: project.edges.map(e => e.edge_id === updated.edge_id ? updated : e)
    });
  };

  const deleteEdge = (edgeId: string) => {
    onUpdateProject({
      ...project,
      edges: project.edges.filter(e => e.edge_id !== edgeId)
    });
    onSelectEntity(null, null);
  };

  const updateItem = (updated: SpatialItem) => {
    if (!parentNodeOfItem) return;
    const updatedItems = (parentNodeOfItem.items || []).map(i => i.item_id === updated.item_id ? updated : i);
    updateNode({ ...parentNodeOfItem, items: updatedItems });
  };

  const deleteItem = (itemId: string) => {
    if (!parentNodeOfItem) return;
    const updatedItems = (parentNodeOfItem.items || []).filter(i => i.item_id !== itemId);
    updateNode({ ...parentNodeOfItem, items: updatedItems });
    onSelectEntity('node', parentNodeOfItem.node_id);
  };

  const addItemToNode = (node: SpatialNode, itemType: ItemType = 'SWITCH') => {
    const newItem: SpatialItem = {
      item_id: `ITM_${Date.now().toString().slice(-4)}`,
      label: `Nuevo ${ITEM_TYPE_LABELS[itemType]}`,
      type: itemType,
      pos_x: Number((node.polygon_2d[0]?.x || 0) + 0.3),
      pos_y: Number((node.polygon_2d[0]?.y || 0) + 0.3),
      width: itemType === 'TOILET' ? 0.45 : itemType === 'SINK' ? 0.60 : 0.40,
      depth: itemType === 'TOILET' ? 0.70 : itemType === 'SINK' ? 0.50 : 0.40,
      z_installation: itemType === 'SWITCH' ? 1.00 : itemType === 'SINK' ? 0.80 : itemType === 'TOILET' ? 0.48 : 0.90,
      z_clearance_under: itemType === 'SINK' ? 0.72 : undefined,
      rotation_deg: 0,
      is_operable: ['SWITCH', 'DOOR_HANDLE', 'INTERCOM', 'GRAB_BAR', 'SINK'].includes(itemType)
    };
    updateNode({ ...node, items: [...(node.items || []), newItem] });
    onSelectEntity('item', newItem.item_id, node.node_id);
  };

  const panelBg = isDark ? 'bg-[#0F172A] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800';
  const cardBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200';
  const inputBg = isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900';
  const labelColor = isDark ? 'text-slate-400' : 'text-slate-500';
  return (
    <aside className={`w-84 border-l flex flex-col h-full overflow-y-auto select-none transition-colors ${panelBg}`}>
      <div className={`p-3.5 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-sky-500" />
          <h2 className="text-xs font-bold tracking-wider uppercase">
            Inspector Espacial
          </h2>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
          isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-100 text-sky-700'
        }`}>
          {selectedEntity.type ? selectedEntity.type.toUpperCase() : 'PROYECTO'}
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {!selectedNode && !selectedEdge && !selectedItem && (
          <div className="space-y-4">
            <div className={`border rounded-lg p-3 space-y-2.5 ${cardBg}`}>
              <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider">Metadatos del Proyecto</h3>
              <div>
                <label className={`text-[11px] ${labelColor}`}>Nombre del Proyecto</label>
                <input
                  type="text"
                  value={project.project_name}
                  onChange={(e) => onUpdateProject({ ...project, project_name: e.target.value })}
                  className={`w-full border rounded px-2.5 py-1.5 text-xs font-medium outline-none focus:border-sky-500 ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[11px] ${labelColor}`}>ID Proyecto</label>
                  <input
                    type="text"
                    value={project.project_id}
                    onChange={(e) => onUpdateProject({ ...project, project_id: e.target.value })}
                    className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] ${labelColor}`}>Nivel / Piso</label>
                  <input
                    type="number"
                    value={project.building_level}
                    onChange={(e) => onUpdateProject({ ...project, building_level: parseInt(e.target.value) || 1 })}
                    className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                  />
                </div>
              </div>
              <div>
                <label className={`text-[11px] ${labelColor}`}>Responsable Técnico</label>
                <input
                  type="text"
                  value={project.author}
                  onChange={(e) => onUpdateProject({ ...project, author: e.target.value })}
                  className={`w-full border rounded px-2.5 py-1.5 text-xs outline-none ${inputBg}`}
                />
              </div>
            </div>

            <div className={`border rounded-lg p-3 space-y-2 text-xs ${cardBg}`}>
              <div className="flex justify-between items-center">
                <span className={labelColor}>Marco Normativo:</span>
                <span className="font-mono text-sky-500 font-bold">OGUC D.S. 50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={labelColor}>Total Recintos:</span>
                <span className="font-mono font-bold">{project.nodes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={labelColor}>Total Puertas / Conexiones:</span>
                <span className="font-mono font-bold">{project.edges.length}</span>
              </div>
            </div>

            <p className="text-[11px] opacity-60 italic text-center leading-relaxed">
              Haz clic en un recinto, puerta u objeto en el lienzo para inspeccionar y ajustar sus dimensiones y cotas.
            </p>
          </div>
        )}
        {selectedNode && (() => {
          const evalNode = diagnostics.node_evaluations[selectedNode.node_id];
          const isOrphan = evalNode?.is_orphan;
          const hasDoor = evalNode?.has_door;

          const bounds = getPolygonBounds(selectedNode.polygon_2d);
          const currentW = selectedNode.dimensions?.width_m ?? Number(bounds.width.toFixed(2));
          const currentL = selectedNode.dimensions?.length_m ?? Number(bounds.height.toFixed(2));

          return (
            <div className="space-y-4">
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                !hasDoor || isOrphan || evalNode?.status === 'NON_COMPLIANT'
                  ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400'
                  : evalNode?.status === 'WARNING'
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {!hasDoor ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : isOrphan || evalNode?.status === 'NON_COMPLIANT' ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : evalNode?.status === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-xs font-bold font-mono">
                    {!hasDoor ? 'SIN PUERTA ASIGNADA' : isOrphan ? 'NODO AISLADO' : evalNode?.status}
                  </span>
                </div>
                <button
                  onClick={() => deleteNode(selectedNode.node_id)}
                  className="opacity-70 hover:opacity-100 hover:text-red-500 p-1 transition-opacity"
                  title="Eliminar Recinto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`space-y-3 p-3 rounded-lg border ${cardBg}`}>
                <div>
                  <label className={`text-[11px] ${labelColor}`}>Etiqueta del Recinto</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => updateNode({ ...selectedNode, label: e.target.value })}
                    className={`w-full border rounded px-2 py-1.5 text-xs ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] ${labelColor}`}>Clasificación OGUC</label>
                  <select
                    value={selectedNode.type}
                    onChange={(e) => updateNode({ ...selectedNode, type: e.target.value as NodeType })}
                    className={`w-full border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                  >
                    {Object.entries(NODE_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[11px] font-semibold text-sky-500`}>Ancho (m)</label>
                    <input
                      type="number"
                      step="0.10"
                      min="0.80"
                      max="15.00"
                      value={currentW}
                      onChange={(e) => updateRoomDimensions(selectedNode, parseFloat(e.target.value) || 1.0, currentL)}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono font-bold ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-semibold text-sky-500`}>Largo (m)</label>
                    <input
                      type="number"
                      step="0.10"
                      min="0.80"
                      max="15.00"
                      value={currentL}
                      onChange={(e) => updateRoomDimensions(selectedNode, currentW, parseFloat(e.target.value) || 1.0)}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono font-bold ${inputBg}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Superficie Útil</label>
                    <div className={`border px-2 py-1 rounded text-xs font-mono font-bold text-sky-500 ${inputBg}`}>
                      {(selectedNode.calculatedArea || 0).toFixed(2)} m²
                    </div>
                  </div>
                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Altura Libre Z (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.80"
                      max="6.00"
                      value={selectedNode.height_z}
                      onChange={(e) => updateNode({ ...selectedNode, height_z: parseFloat(e.target.value) || 2.40 })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Artefactos ({selectedNode.items?.length || 0})</span>
                  <button
                    onClick={() => addItemToNode(selectedNode)}
                    className="flex items-center space-x-1 text-[11px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded hover:bg-sky-500/20 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedNode.items?.map(itm => (
                    <div
                      key={itm.item_id}
                      onClick={() => onSelectEntity('item', itm.item_id, selectedNode.node_id)}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors text-xs ${cardBg}`}
                    >
                      <div>
                        <div className="font-medium">{itm.label || itm.type}</div>
                        <div className="text-[10px] font-mono opacity-60">
                          {(itm.width || 0.5).toFixed(2)}x{(itm.depth || 0.5).toFixed(2)}m | Z={itm.z_installation.toFixed(2)}m | Rot={itm.rotation_deg || 0}°
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded">
                        {itm.type}
                      </span>
                    </div>
                  ))}
                  {(!selectedNode.items || selectedNode.items.length === 0) && (
                    <p className="text-[11px] opacity-50 italic">No hay artefactos en este recinto.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {selectedEdge && (() => {
          const isCompliant = selectedEdge.clear_width >= 0.80;

          return (
            <div className="space-y-4">
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                isCompliant
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {isCompliant ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-xs font-bold font-mono">
                    {isCompliant ? 'CONFORME (= 0.80 m)' : 'ERR_DOOR_WIDTH (< 0.80 m)'}
                  </span>
                </div>
                <button
                  onClick={() => deleteEdge(selectedEdge.edge_id)}
                  className="opacity-70 hover:opacity-100 hover:text-red-500 p-1"
                  title="Eliminar Puerta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`space-y-3 p-3 rounded-lg border ${cardBg}`}>
                <div>
                  <label className={`text-[11px] ${labelColor}`}>Etiqueta de la Puerta</label>
                  <input
                    type="text"
                    value={selectedEdge.label || ''}
                    onChange={(e) => updateEdge({ ...selectedEdge, label: e.target.value })}
                    className={`w-full border rounded px-2 py-1.5 text-xs ${inputBg}`}
                  />
                </div>

                <div className="space-y-2 border-t border-b py-2.5 my-2 border-slate-700/40">
                  <span className="text-[11px] font-bold text-sky-500 uppercase tracking-wider block">
                    Conectividad Entre Recintos
                  </span>

                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Selector A (Recinto Origen):</label>
                    <select
                      value={selectedEdge.connects[0] || ''}
                      onChange={(e) => updateEdge({
                        ...selectedEdge,
                        connects: [e.target.value, selectedEdge.connects[1]]
                      })}
                      className={`w-full border rounded px-2 py-1.5 text-xs outline-none font-medium ${inputBg}`}
                    >
                      {project.nodes.map(n => (
                        <option key={n.node_id} value={n.node_id}>
                          {n.label} ({n.node_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Selector B (Recinto Destino):</label>
                    <select
                      value={selectedEdge.connects[1] || ''}
                      onChange={(e) => updateEdge({
                        ...selectedEdge,
                        connects: [selectedEdge.connects[0], e.target.value]
                      })}
                      className={`w-full border rounded px-2 py-1.5 text-xs outline-none font-medium ${inputBg}`}
                    >
                      {project.nodes.map(n => (
                        <option key={n.node_id} value={n.node_id}>
                          {n.label} ({n.node_id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-[11px] ${labelColor}`}>Ancho Libre de Paso</label>
                    <span className={`font-mono text-xs font-bold ${isCompliant ? 'text-emerald-500' : 'text-red-500'}`}>
                      {selectedEdge.clear_width.toFixed(2)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="1.50"
                    step="0.05"
                    value={selectedEdge.clear_width}
                    onChange={(e) => updateEdge({ ...selectedEdge, clear_width: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] opacity-60 font-mono mt-0.5">
                    <span>0.50m</span>
                    <span className="text-emerald-500 font-bold">= 0.80m OGUC</span>
                    <span>1.50m</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-[11px] font-semibold text-sky-500 flex items-center space-x-1`}>
                      <RotateCw className="w-3 h-3" />
                      <span>Orientación / Rotación Vectorial</span>
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-500">
                      {selectedEdge.rotation_deg || 0}°
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={selectedEdge.rotation_deg || 0}
                      onChange={(e) => updateEdge({ ...selectedEdge, rotation_deg: parseInt(e.target.value) || 0 })}
                      className="flex-1 accent-sky-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={selectedEdge.rotation_deg || 0}
                      onChange={(e) => updateEdge({ ...selectedEdge, rotation_deg: parseInt(e.target.value) || 0 })}
                      className={`w-14 border rounded px-1.5 py-0.5 text-xs font-mono text-center ${inputBg}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] opacity-60 font-mono mt-1">
                    <button type="button" onClick={() => updateEdge({ ...selectedEdge, rotation_deg: 0 })} className="hover:underline">0°</button>
                    <button type="button" onClick={() => updateEdge({ ...selectedEdge, rotation_deg: 90 })} className="hover:underline">90°</button>
                    <button type="button" onClick={() => updateEdge({ ...selectedEdge, rotation_deg: 180 })} className="hover:underline">180°</button>
                    <button type="button" onClick={() => updateEdge({ ...selectedEdge, rotation_deg: 270 })} className="hover:underline">270°</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Posición X (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedEdge.position.x}
                      onChange={(e) => updateEdge({
                        ...selectedEdge,
                        position: { ...selectedEdge.position, x: parseFloat(e.target.value) || 0 }
                      })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Posición Y (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedEdge.position.y}
                      onChange={(e) => updateEdge({
                        ...selectedEdge,
                        position: { ...selectedEdge.position, y: parseFloat(e.target.value) || 0 }
                      })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-[11px] ${labelColor}`}>Tipo de Apertura</label>
                  <select
                    value={selectedEdge.swing_direction || 'IN_A'}
                    onChange={(e) => updateEdge({ ...selectedEdge, swing_direction: e.target.value as any })}
                    className={`w-full border rounded px-2 py-1.5 text-xs ${inputBg}`}
                  >
                    <option value="IN_A">Abatible Hacia Recinto A</option>
                    <option value="IN_B">Abatible Hacia Recinto B</option>
                    <option value="SLIDING">Corredera (Sliding)</option>
                    <option value="DOUBLE">Doble Hoja</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })()}

        {selectedItem && (() => {
          const isOperable = selectedItem.is_operable || ['SWITCH', 'DOOR_HANDLE', 'INTERCOM', 'GRAB_BAR', 'SINK'].includes(selectedItem.type);
          const isZCompliant = !isOperable || (selectedItem.z_installation >= 0.40 && selectedItem.z_installation <= 1.20);

          return (
            <div className="space-y-4">
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                isZCompliant
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {isZCompliant ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-xs font-bold font-mono">
                    {isZCompliant ? 'COTA Z CONFORME' : 'ERR_Z_INSTALLATION'}
                  </span>
                </div>
                <button
                  onClick={() => deleteItem(selectedItem!.item_id)}
                  className="opacity-70 hover:opacity-100 hover:text-red-500 p-1"
                  title="Eliminar Artefacto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`space-y-3 p-3 rounded-lg border ${cardBg}`}>
                <div>
                  <label className={`text-[11px] ${labelColor}`}>Etiqueta del Artefacto</label>
                  <input
                    type="text"
                    value={selectedItem.label}
                    onChange={(e) => updateItem({ ...selectedItem!, label: e.target.value })}
                    className={`w-full border rounded px-2 py-1.5 text-xs ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] ${labelColor}`}>Tipo de Artefacto</label>
                  <select
                    value={selectedItem.type}
                    onChange={(e) => updateItem({ ...selectedItem!, type: e.target.value as ItemType })}
                    className={`w-full border rounded px-2 py-1.5 text-xs ${inputBg}`}
                  >
                    {Object.entries(ITEM_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* MODIFICACIÓN DIRECTA DE ANCHO Y LARGO (METROS) PARA ARTEFACTOS */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-sky-500">Ancho (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.10"
                      max="10.00"
                      value={selectedItem.width !== undefined ? selectedItem.width : 0.50}
                      onChange={(e) => updateItem({ ...selectedItem!, width: parseFloat(e.target.value) || 0.10 })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono font-bold ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-sky-500">Largo / Fondo (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.10"
                      max="10.00"
                      value={selectedItem.depth !== undefined ? selectedItem.depth : 0.50}
                      onChange={(e) => updateItem({ ...selectedItem!, depth: parseFloat(e.target.value) || 0.10 })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono font-bold ${inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-[11px] ${labelColor}`}>Cota de Instalación Z (m)</label>
                    <span className={`font-mono text-xs font-bold ${isZCompliant ? 'text-emerald-500' : 'text-red-500'}`}>
                      Z = {selectedItem.z_installation.toFixed(2)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.00"
                    max="2.20"
                    step="0.05"
                    value={selectedItem.z_installation}
                    onChange={(e) => updateItem({ ...selectedItem!, z_installation: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] opacity-60 font-mono mt-0.5">
                    <span>0.00m</span>
                    <span className="text-emerald-500 font-bold">0.40m - 1.20m OGUC</span>
                    <span>2.20m</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-[11px] font-semibold text-sky-500 flex items-center space-x-1`}>
                      <RotateCw className="w-3 h-3" />
                      <span>Ángulo de Rotación (0° - 360°)</span>
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-500">
                      {selectedItem.rotation_deg || 0}°
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={selectedItem.rotation_deg || 0}
                      onChange={(e) => updateItem({ ...selectedItem!, rotation_deg: parseInt(e.target.value) || 0 })}
                      className="flex-1 accent-sky-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={selectedItem.rotation_deg || 0}
                      onChange={(e) => updateItem({ ...selectedItem!, rotation_deg: parseInt(e.target.value) || 0 })}
                      className={`w-14 border rounded px-1.5 py-0.5 text-xs font-mono text-center ${inputBg}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] opacity-60 font-mono mt-1">
                    <button type="button" onClick={() => updateItem({ ...selectedItem!, rotation_deg: 0 })} className="hover:underline">0°</button>
                    <button type="button" onClick={() => updateItem({ ...selectedItem!, rotation_deg: 90 })} className="hover:underline">90°</button>
                    <button type="button" onClick={() => updateItem({ ...selectedItem!, rotation_deg: 180 })} className="hover:underline">180°</button>
                    <button type="button" onClick={() => updateItem({ ...selectedItem!, rotation_deg: 270 })} className="hover:underline">270°</button>
                  </div>
                </div>

                {selectedItem.type === 'SINK' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-[11px] ${labelColor}`}>Espacio Libre Inferior Rodillas</label>
                      <span className="font-mono text-xs font-bold text-sky-500">
                        {(selectedItem.z_clearance_under || 0.70).toFixed(2)} m
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.02"
                      min="0.30"
                      max="1.00"
                      value={selectedItem.z_clearance_under || 0.70}
                      onChange={(e) => updateItem({ ...selectedItem!, z_clearance_under: parseFloat(e.target.value) || 0.70 })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                    />
                    <p className="text-[10px] opacity-60 mt-1">Exigencia OGUC: = 0.70 m libres bajo cubierta.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Posición X (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedItem.pos_x}
                      onChange={(e) => updateItem({ ...selectedItem!, pos_x: parseFloat(e.target.value) || 0 })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] ${labelColor}`}>Posición Y (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedItem.pos_y}
                      onChange={(e) => updateItem({ ...selectedItem!, pos_y: parseFloat(e.target.value) || 0 })}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};
