import React from 'react';
import { ProjectData, DiagnosticResult, NODE_TYPE_LABELS } from '../types/oguc';
import { X, Network, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface TopologicalGraphModalProps {
  project: ProjectData;
  diagnostics: DiagnosticResult;
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const TopologicalGraphModal: React.FC<TopologicalGraphModalProps> = ({
  project,
  diagnostics,
  isOpen,
  onClose,
  onSelectNode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Network className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              Grafo Topológico de Accesibilidad y Recorrido BFS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Explicación de la Lógica del Motor */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-lg space-y-2 text-xs">
            <h3 className="font-bold text-sky-400 uppercase tracking-wider">
              Lógica del Motor Topológico (BFS desde Acceso Principal)
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Cada recinto es instanciado como un <strong className="text-white">Nodo (N)</strong>. Cada puerta coincidente entre recintos se evalúa como una <strong className="text-white">Arista (E)</strong>.
              El motor ejecuta un recorrido en anchura (BFS) verificando que el ancho libre de paso cumpla con <code className="text-emerald-400 font-mono font-bold">clear_width ≥ 0.80 m</code>.
              Los nodos sin ruta continua transitable son clasificados como <strong className="text-red-400">Nodos Huérfanos / Aislados</strong>.
            </p>
          </div>

          {/* Matriz de Nodos del Grafo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.nodes.map(node => {
              const evalNode = diagnostics.node_evaluations[node.node_id];
              const isReachable = evalNode?.is_reachable_bfs;
              const isRoot = node.type === 'ACCESO_PRINCIPAL';

              return (
                <div
                  key={node.node_id}
                  onClick={() => { onSelectNode(node.node_id); onClose(); }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    isRoot
                      ? 'bg-sky-950/30 border-sky-600/80 shadow-lg shadow-sky-950/50'
                      : isReachable
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-red-950/30 border-red-800/80 shadow-lg shadow-red-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {isReachable ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-red-400" />
                      )}
                      <h4 className="font-bold text-sm text-white">{node.label}</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-sky-400 font-bold border border-slate-700">
                      {node.node_id}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipo:</span>
                      <span>{NODE_TYPE_LABELS[node.type] || node.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Superficie útil:</span>
                      <span className="text-white">{(node.calculatedArea || 0).toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profundidad BFS:</span>
                      <span className="text-sky-300">{evalNode?.bfs_depth !== undefined ? `Nivel ${evalNode.bfs_depth}` : 'N/A'}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Ruta Topológica:</span>
                      <span className={`font-bold ${isReachable ? 'text-emerald-400' : 'text-red-400'}`}>
                        {evalNode?.bfs_path ? evalNode.bfs_path.join(' → ') : 'Sin Conexión'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aristas y Puertas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aristas y Puertas de Interconexión ({project.edges.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
              {project.edges.map(edge => {
                const isTraversable = edge.clear_width >= 0.80;
                return (
                  <div
                    key={edge.edge_id}
                    className={`p-2.5 rounded-lg border ${
                      isTraversable ? 'bg-slate-900 border-slate-800' : 'bg-red-950/40 border-red-800'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-200">{edge.label || edge.edge_id}</span>
                      <span className={isTraversable ? 'text-emerald-400' : 'text-red-400'}>
                        {edge.clear_width.toFixed(2)} m
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {edge.connects[0]} ↔ {edge.connects[1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
