import React from 'react';
import {
  ProjectData,
  NodeType,
  ItemType,
  SpatialNode,
  SpatialEdge,
  SpatialItem,
  ITEM_TYPE_LABELS,
  NODE_TYPE_LABELS
} from '../types/oguc';
import {
  Plus,
  DoorOpen,
  Bath,
  BedDouble,
  CookingPot,
  Sparkles,
  ToggleLeft,
  Grid,
  SquareDashedBottom
} from 'lucide-react';

interface ItemToolbarProps {
  project: ProjectData;
  onUpdateProject: (updated: ProjectData) => void;
  onSelectEntity: (type: 'node' | 'edge' | 'item' | null, id: string | null, subId?: string | null) => void;
}

export const ItemToolbar: React.FC<ItemToolbarProps> = ({
  project,
  onUpdateProject,
  onSelectEntity
}) => {
  // Crear nuevo recinto
  const handleAddRoom = (type: NodeType) => {
    // Buscar posición libre a la derecha del último recinto
    let maxX = 0;
    project.nodes.forEach(n => {
      n.polygon_2d.forEach(p => {
        if (p.x > maxX) maxX = p.x;
      });
    });

    const startX = maxX > 0 ? Number((maxX + 0.5).toFixed(1)) : 0;
    const width = type === 'RESTROOM_ACCESSIBLE' ? 2.4 : type === 'BEDROOM_ACCESSIBLE' ? 3.5 : 2.5;
    const depth = type === 'RESTROOM_ACCESSIBLE' ? 2.2 : type === 'BEDROOM_ACCESSIBLE' ? 3.2 : 2.5;

    const newId = `REC_${Date.now().toString().slice(-4)}`;
    const newNode: SpatialNode = {
      node_id: newId,
      label: NODE_TYPE_LABELS[type] || 'Nuevo Recinto',
      type: type,
      polygon_2d: [
        { x: startX, y: 0.0 },
        { x: Number((startX + width).toFixed(2)), y: 0.0 },
        { x: Number((startX + width).toFixed(2)), y: depth },
        { x: startX, y: depth }
      ],
      height_z: 2.40,
      items: []
    };

    onUpdateProject({
      ...project,
      nodes: [...project.nodes, newNode]
    });
    onSelectEntity('node', newId);
  };

  // Crear nueva puerta
  const handleAddDoor = () => {
    if (project.nodes.length === 0) return;
    const nodeA = project.nodes[0];
    const nodeB = project.nodes[1] || nodeA;

    const newEdgeId = `DOOR_${Date.now().toString().slice(-4)}`;
    const newEdge: SpatialEdge = {
      edge_id: newEdgeId,
      label: 'Puerta Reglamentaria 0.85m',
      connects: [nodeA.node_id, nodeB.node_id],
      clear_width: 0.85,
      position: {
        x: Number((nodeA.polygon_2d[1]?.x || 2.0).toFixed(2)),
        y: Number(((nodeA.polygon_2d[0]?.y || 0) + 1.0).toFixed(2))
      },
      swing_direction: 'IN_A'
    };

    onUpdateProject({
      ...project,
      edges: [...project.edges, newEdge]
    });
    onSelectEntity('edge', newEdgeId);
  };

  // Añadir ítem a recinto activo o primero
  const handleAddItem = (type: ItemType) => {
    if (project.nodes.length === 0) {
      handleAddRoom('ACCESO_PRINCIPAL');
      return;
    }

    const targetNode = project.nodes[0];
    const newItemId = `ITM_${Date.now().toString().slice(-4)}`;
    const newItem: SpatialItem = {
      item_id: newItemId,
      label: ITEM_TYPE_LABELS[type],
      type: type,
      pos_x: Number((targetNode.polygon_2d[0]?.x || 0) + 0.3),
      pos_y: Number((targetNode.polygon_2d[0]?.y || 0) + 0.3),
      width: type === 'TOILET' ? 0.45 : type === 'SINK' ? 0.60 : type === 'BED' ? 1.60 : 0.40,
      depth: type === 'TOILET' ? 0.70 : type === 'SINK' ? 0.50 : type === 'BED' ? 2.00 : 0.40,
      z_installation: type === 'SWITCH' ? 1.00 : type === 'SINK' ? 0.80 : type === 'TOILET' ? 0.48 : 0.90,
      z_clearance_under: type === 'SINK' ? 0.72 : undefined,
      is_operable: ['SWITCH', 'DOOR_HANDLE', 'INTERCOM', 'GRAB_BAR', 'SINK'].includes(type)
    };

    const updatedNodes = project.nodes.map(n => {
      if (n.node_id === targetNode.node_id) {
        return { ...n, items: [...(n.items || []), newItem] };
      }
      return n;
    });

    onUpdateProject({ ...project, nodes: updatedNodes });
    onSelectEntity('item', newItemId, targetNode.node_id);
  };

  return (
    <div className="absolute top-4 left-4 flex flex-col space-y-2 select-none z-10">
      <div className="bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-lg p-1.5 shadow-xl flex flex-col space-y-1">
        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
          Insertar Recintos
        </span>
        <button
          onClick={() => handleAddRoom('ACCESO_PRINCIPAL')}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-sky-400 rounded transition-colors"
          title="Crear Acceso Principal"
        >
          <SquareDashedBottom className="w-3.5 h-3.5 text-sky-400" />
          <span>Acceso Principal</span>
        </button>
        <button
          onClick={() => handleAddRoom('RESTROOM_ACCESSIBLE')}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 rounded transition-colors"
          title="Crear Baño Accesible Universal (D.S. 50)"
        >
          <Bath className="w-3.5 h-3.5 text-emerald-400" />
          <span>Baño Accesible</span>
        </button>
        <button
          onClick={() => handleAddRoom('BEDROOM_ACCESSIBLE')}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-indigo-400 rounded transition-colors"
          title="Crear Dormitorio Accesible"
        >
          <BedDouble className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dormitorio</span>
        </button>
        <button
          onClick={() => handleAddRoom('CIRCULATION_CORRIDOR')}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-400 rounded transition-colors"
          title="Crear Pasillo de Circulación"
        >
          <Grid className="w-3.5 h-3.5 text-amber-400" />
          <span>Pasillo Flujo</span>
        </button>
      </div>

      <div className="bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-lg p-1.5 shadow-xl flex flex-col space-y-1">
        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
          Conectores & Artefactos
        </span>
        <button
          onClick={handleAddDoor}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 rounded transition-colors font-medium"
          title="Insertar Puerta Accesible (≥ 0.80 m)"
        >
          <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>Puerta (≥0.80m)</span>
        </button>
        <button
          onClick={() => handleAddItem('TOILET')}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-sky-400 rounded transition-colors"
        >
          <span>Inodoro Universal</span>
        </button>
        <button
          onClick={() => handleAddItem('SINK')}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-sky-400 rounded transition-colors"
        >
          <span>Lavamanos Z=0.80</span>
        </button>
        <button
          onClick={() => handleAddItem('SWITCH')}
          className="flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 rounded transition-colors"
        >
          <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interruptor Z=1.00</span>
        </button>
      </div>
    </div>
  );
};
