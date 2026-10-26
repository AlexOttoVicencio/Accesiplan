import React from 'react';
import { ProjectData, DiagnosticResult, NODE_TYPE_LABELS } from '../types/oguc';
import { X, Network, CheckCircle2, AlertOctagon } from 'lucide-react';

interface TopologicalGraphModalProps {
  project: ProjectData;
  diagnostics: DiagnosticResult;
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const TopologicalGraphModal: React.FC<TopologicalGraphModalProps> = ({
  project,
  diagnostics,
  theme,
  isOpen,
  onClose,
  onSelectNode
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#0F172A] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <Network className="w-5 h-5 text-sky-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Grafo Topológico de Accesibilidad y Recorrido BFS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className={`p-4 rounded-lg space-y-2 text-xs border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className="font-bold text-sky-500 uppercase tracking-wider">
              Lógica del Motor Topológico (BFS desde Acceso Principal)
            </h3>
            <p className="opacity-80 leading-relaxed">
              Cada recinto cerrado se instancia como un <strong>Nodo (N)</strong>. Cada puerta vincula dos recintos y se inicializa como una <strong>Arista (E)</strong>.
              El motor ejecuta un recorrido BFS verificando <code>clear_width = 0.80 m</code>. Todo recinto sin puerta asociada se clasifica automáticamente con error crítico <code>OGUC_ERR_ROOM_WITHOUT_DOOR</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {project.nodes.map(node => {
              const evalNode = diagnostics.node_evaluations[node.node_id];
              const isReachable = evalNode?.is_reachable_bfs;
              const hasDoor = evalNode?.has_door;
              const isRoot = node.type === 'ACCESO_PRINCIPAL';

              return (
                <div
                  key={node.node_id}
                  onClick={() => { onSelectNode(node.node_id); onClose(); }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    isRoot
                      ? isDark ? 'bg-sky-950/30 border-sky-600/80' : 'bg-sky-50 border-sky-300'
                      : isReachable && hasDoor
                      ? isDark ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-red-950/30 border-red-800/80' : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {isReachable && hasDoor ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-red-500" />
                      )}
                      <h4 className="font-bold text-sm">{node.label}</h4>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-sky-400' : 'bg-white border-slate-300 text-sky-600'
                    }`}>
                      {node.node_id}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 font-mono opacity-85">
                    <div className="flex justify-between">
                      <span className="opacity-60">Tipo OGUC:</span>
                      <span>{NODE_TYPE_LABELS[node.type] || node.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Dimensiones:</span>
                      <span>{node.dimensions ? `${node.dimensions.width_m}x${node.dimensions.length_m}m` : '-'} ({(node.calculatedArea || 0).toFixed(2)} m²)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Profundidad BFS:</span>
                      <span>{evalNode?.bfs_depth !== undefined && evalNode.bfs_depth >= 0 ? `Nivel ${evalNode.bfs_depth}` : 'Sin acceso'}</span>
                    </div>
                    <div className="pt-2 border-t flex items-center justify-between text-[11px] border-slate-700/40">
                      <span className="opacity-60">Ruta Topológica:</span>
                      <span className={`font-bold ${isReachable && hasDoor ? 'text-emerald-500' : 'text-red-500'}`}>
                        {!hasDoor ? 'Sin puerta asociada' : evalNode?.bfs_path ? evalNode.bfs_path.join(' ? ') : 'Aislado'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold opacity-60 uppercase tracking-wider">
              Aristas y Puertas Registradas ({project.edges.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
              {project.edges.map(edge => {
                const isTraversable = edge.clear_width >= 0.80;
                return (
                  <div
                    key={edge.edge_id}
                    className={`p-2.5 rounded-lg border ${
                      isTraversable
                        ? isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                        : isDark ? 'bg-red-950/40 border-red-800' : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>{edge.label || edge.edge_id}</span>
                      <span className={isTraversable ? 'text-emerald-500' : 'text-red-500'}>
                        {edge.clear_width.toFixed(2)} m
                      </span>
                    </div>
                    <div className="text-[10px] opacity-60 mt-1">
                      {edge.connects[0]} ? {edge.connects[1]} | Rot: {edge.rotation_deg || 0}°
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
