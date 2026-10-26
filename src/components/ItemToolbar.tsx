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
  DoorOpen,
  Bath,
  BedDouble,
  Grid,
  SquareDashedBottom,
  ToggleLeft
} from 'lucide-react';

interface ItemToolbarProps {
  project: ProjectData;
  theme: 'dark' | 'light';
  onUpdateProject: (updated: ProjectData) => void;
  onSelectEntity: (type: 'node' | 'edge' | 'item' | null, id: string | null, subId?: string | null) => void;
}

export const ItemToolbar: React.FC<ItemToolbarProps> = ({
  project,
  theme,
  onUpdateProject,
  onSelectEntity
}) => {
  const isDark = theme === 'dark';

  const handleAddRoom = (type: NodeType) => {
    let maxX = 0;
    project.nodes.forEach(n => {
      n.polygon_2d.forEach(p => {
        if (p.x > maxX) maxX = p.x;
      });
    });

    const startX = maxX > 0 ? Number((maxX + 0.5).toFixed(1)) : 0;
    const width = type === 'RESTROOM_ACCESSIBLE' ? 2.6 : type === 'BEDROOM_ACCESSIBLE' ? 3.6 : 2.5;
    const depth = type === 'RESTROOM_ACCESSIBLE' ? 2.4 : type === 'BEDROOM_ACCESSIBLE' ? 3.8 : 2.5;

    const newId = `REC_${Date.now().toString().slice(-4)}`;
    const newNode: SpatialNode = {
      node_id: newId,
      label: NODE_TYPE_LABELS[type] || 'Nuevo Recinto',
      type: type,
      dimensions: {
        width_m: width,
        length_m: depth
      },
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
      rotation_deg: 90,
      swing_direction: 'IN_A'
    };

    onUpdateProject({
      ...project,
      edges: [...project.edges, newEdge]
    });
    onSelectEntity('edge', newEdgeId);
  };

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
      rotation_deg: 0,
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

  const panelBg = isDark
    ? 'bg-slate-900/95 border-slate-700/80 text-slate-200'
    : 'bg-white/95 border-slate-300 text-slate-800 shadow-md';

  const hoverBg = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  return (
    <div className="absolute top-4 left-4 flex flex-col space-y-2 select-none z-10">
      <div className={`backdrop-blur border rounded-lg p-1.5 shadow-xl flex flex-col space-y-1 ${panelBg}`}>
        <span className="text-[10px] font-bold opacity-60 px-2 py-0.5 uppercase tracking-wider">
          Insertar Recintos
        </span>
        <button
          onClick={() => handleAddRoom('ACCESO_PRINCIPAL')}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors ${hoverBg}`}
          title="Crear Acceso Principal"
        >
          <SquareDashedBottom className="w-3.5 h-3.5 text-sky-500" />
          <span>Acceso Principal</span>
        </button>
        <button
          onClick={() => handleAddRoom('RESTROOM_ACCESSIBLE')}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors ${hoverBg}`}
          title="Crear Baño Accesible Universal (D.S. 50)"
        >
          <Bath className="w-3.5 h-3.5 text-emerald-500" />
          <span>Baño Accesible</span>
        </button>
        <button
          onClick={() => handleAddRoom('BEDROOM_ACCESSIBLE')}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors ${hoverBg}`}
          title="Crear Dormitorio Accesible"
        >
          <BedDouble className="w-3.5 h-3.5 text-indigo-500" />
          <span>Dormitorio</span>
        </button>
        <button
          onClick={() => handleAddRoom('CIRCULATION_CORRIDOR')}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors ${hoverBg}`}
          title="Crear Pasillo de Circulación"
        >
          <Grid className="w-3.5 h-3.5 text-amber-500" />
          <span>Pasillo Flujo</span>
        </button>
      </div>

      <div className={`backdrop-blur border rounded-lg p-1.5 shadow-xl flex flex-col space-y-1 ${panelBg}`}>
        <span className="text-[10px] font-bold opacity-60 px-2 py-0.5 uppercase tracking-wider">
          Conectores & Artefactos
        </span>
        <button
          onClick={handleAddDoor}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded font-medium transition-colors ${hoverBg}`}
          title="Insertar Puerta Accesible (= 0.80 m)"
        >
          <DoorOpen className="w-3.5 h-3.5 text-emerald-500" />
          <span>Puerta (=0.80m)</span>
        </button>
        <button
          onClick={() => handleAddItem('TOILET')}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors ${hoverBg}`}
        >
          <span>Inodoro Universal</span>
        </button>
        <button
          onClick={() => handleAddItem('SINK')}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors ${hoverBg}`}
        >
          <span>Lavamanos Z=0.80</span>
        </button>
        <button
          onClick={() => handleAddItem('SWITCH')}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors ${hoverBg}`}
        >
          <ToggleLeft className="w-3.5 h-3.5 text-emerald-500" />
          <span>Interruptor Z=1.00</span>
        </button>
      </div>
    </div>
  );
};
