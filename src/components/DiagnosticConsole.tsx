import React, { useState } from 'react';
import {
  ProjectData,
  DiagnosticResult,
  RuleViolation,
  NODE_TYPE_LABELS,
  ViolationSeverity
} from '../types/oguc';
import {
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Activity,
  Table,
  ListFilter,
  Network,
  Terminal,
  LocateFixed,
  ArrowUpRight
} from 'lucide-react';

interface DiagnosticConsoleProps {
  project: ProjectData;
  diagnostics: DiagnosticResult;
  onSelectEntity: (type: 'node' | 'edge' | 'item' | null, id: string | null, subId?: string | null) => void;
  onOpenGraphModal: () => void;
}

export const DiagnosticConsole: React.FC<DiagnosticConsoleProps> = ({
  project,
  diagnostics,
  onSelectEntity,
  onOpenGraphModal
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'violations' | 'topology' | 'logs'>('violations');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | ViolationSeverity>('ALL');

  const blockingCount = diagnostics.violations.filter(v => v.severity === 'BLOCKING_ERROR').length;
  const warningCount = diagnostics.violations.filter(v => v.severity === 'WARNING').length;

  const filteredViolations = diagnostics.violations.filter(v => {
    if (severityFilter === 'ALL') return true;
    return v.severity === severityFilter;
  });

  const handleLocateViolation = (v: RuleViolation) => {
    if (v.item_id && v.node_id) {
      onSelectEntity('item', v.item_id, v.node_id);
    } else if (v.edge_id) {
      onSelectEntity('edge', v.edge_id);
    } else if (v.node_id) {
      onSelectEntity('node', v.node_id);
    }
  };

  return (
    <div className="bg-[#0B0F17] border-t border-slate-800 flex flex-col transition-all duration-200 z-20">
      {/* Barra de Control / Título de la Consola */}
      <div className="h-10 bg-[#0F172A] border-b border-slate-800 px-4 flex items-center justify-between select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Motor de Diagnóstico Normativo OGUC</span>
          </div>

          {/* Indicador de Cumplimiento */}
          <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-700/80">
            <div
              className={`w-2 h-2 rounded-full ${
                diagnostics.compliance_percentage === 100
                  ? 'bg-emerald-500 animate-pulse'
                  : diagnostics.compliance_percentage > 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-mono font-bold text-slate-100">
              {diagnostics.compliance_percentage}% Accesible
            </span>
          </div>

          {/* Badges de Conteo de Infracciones */}
          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
            <span className="bg-red-950/80 text-red-400 border border-red-800/60 px-2 py-0.5 rounded flex items-center space-x-1">
              <XCircle className="w-3 h-3" />
              <span>{blockingCount} Errores</span>
            </span>
            <span className="bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{warningCount} Advertencias</span>
            </span>
          </div>
        </div>

        {/* Pestañas de la Consola */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => { setActiveTab('violations'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'violations' && isExpanded
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Infracciones ({diagnostics.violations.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('matrix'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'matrix' && isExpanded
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Matriz OGUC</span>
          </button>

          <button
            onClick={() => { setActiveTab('topology'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'topology' && isExpanded
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Grafo Topológico</span>
          </button>

          <button
            onClick={() => { setActiveTab('logs'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'logs' && isExpanded
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs</span>
          </button>

          {/* Botón Minimizar / Expandir */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1.5 ml-2 transition-colors"
            title={isExpanded ? 'Minimizar consola' : 'Expandir consola'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Contenido Expandible de la Consola */}
      {isExpanded && (
        <div className="h-56 overflow-y-auto bg-[#090D14] p-3 text-slate-300">
          {/* --- TAB 1: INFRACCIONES ACTIVAS --- */}
          {activeTab === 'violations' && (
            <div className="space-y-2.5">
              {/* Filtros de Severidad */}
              <div className="flex items-center space-x-2 text-xs mb-2">
                <span className="text-slate-500 font-medium">Filtrar por:</span>
                <button
                  onClick={() => setSeverityFilter('ALL')}
                  className={`px-2 py-0.5 rounded ${
                    severityFilter === 'ALL' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas ({diagnostics.violations.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('BLOCKING_ERROR')}
                  className={`px-2 py-0.5 rounded ${
                    severityFilter === 'BLOCKING_ERROR' ? 'bg-red-950 text-red-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bloqueantes ({blockingCount})
                </button>
                <button
                  onClick={() => setSeverityFilter('WARNING')}
                  className={`px-2 py-0.5 rounded ${
                    severityFilter === 'WARNING' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Advertencias ({warningCount})
                </button>
              </div>

              {filteredViolations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-400 space-y-1">
                  <ShieldCheck className="w-8 h-8" />
                  <span className="text-sm font-semibold">Sin Infracciones Normativas</span>
                  <span className="text-xs text-slate-400">Todos los recintos, puertas y alturas cumplen con la OGUC D.S. 50.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredViolations.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 ${
                      v.severity === 'BLOCKING_ERROR'
                        ? 'bg-red-950/20 border-red-900/60 text-red-200'
                        : 'bg-amber-950/20 border-amber-900/60 text-amber-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
                          {v.severity === 'BLOCKING_ERROR' ? (
                            <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          )}
                          <span className="text-xs font-bold">{v.title}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-900/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                          {v.oguc_article}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">{v.description}</p>
                    </div>

                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px] flex items-center justify-between">
                      <div className="font-mono space-x-3">
                        <span className="text-slate-400">Actual: <strong className="text-red-400">{v.current_value}</strong></span>
                        <span className="text-slate-400">Exigido: <strong className="text-emerald-400">{v.required_value}</strong></span>
                      </div>

                      <button
                        onClick={() => handleLocateViolation(v)}
                        className="flex items-center space-x-1 text-[10px] text-sky-400 hover:text-sky-300 font-semibold bg-sky-950 px-2 py-0.5 rounded border border-sky-800/80 transition-colors"
                      >
                        <LocateFixed className="w-3 h-3" />
                        <span>Enfocar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB 2: MATRIZ DE CUMPLIMIENTO OGUC --- */}
          {activeTab === 'matrix' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="p-2">ID</th>
                    <th className="p-2">Recinto</th>
                    <th className="p-2">Tipo OGUC</th>
                    <th className="p-2">Superficie</th>
                    <th className="p-2">R1 Puertas (≥0.80m)</th>
                    <th className="p-2">R2 Giro (Ø1.50m)</th>
                    <th className="p-2">R3 Alturas Z</th>
                    <th className="p-2">R4 Transf.</th>
                    <th className="p-2">Ruta BFS</th>
                    <th className="p-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {project.nodes.map(node => {
                    const evalNode = diagnostics.node_evaluations[node.node_id];
                    if (!evalNode) return null;

                    return (
                      <tr
                        key={node.node_id}
                        onClick={() => onSelectEntity('node', node.node_id)}
                        className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                      >
                        <td className="p-2 text-sky-400 font-bold">{node.node_id}</td>
                        <td className="p-2 font-sans font-medium text-slate-200">{node.label}</td>
                        <td className="p-2 text-[10px] text-slate-400">{NODE_TYPE_LABELS[node.type] || node.type}</td>
                        <td className="p-2 text-slate-300">{evalNode.area_m2.toFixed(2)} m²</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r1_door_status === 'PASS' ? 'bg-emerald-950 text-emerald-400' : evalNode.r1_door_status === 'FAIL' ? 'bg-red-950 text-red-400' : 'text-slate-500'
                          }`}>
                            {evalNode.r1_door_status}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r2_turning_radius === 'PASS' ? 'bg-emerald-950 text-emerald-400' : evalNode.r2_turning_radius === 'WARN' ? 'bg-amber-950 text-amber-400' : 'text-slate-500'
                          }`}>
                            {evalNode.r2_turning_radius}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r3_z_installation === 'PASS' ? 'bg-emerald-950 text-emerald-400' : evalNode.r3_z_installation === 'FAIL' ? 'bg-red-950 text-red-400' : 'text-slate-500'
                          }`}>
                            {evalNode.r3_z_installation}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r4_approach_space === 'PASS' ? 'bg-emerald-950 text-emerald-400' : evalNode.r4_approach_space === 'FAIL' ? 'bg-red-950 text-red-400' : 'text-slate-500'
                          }`}>
                            {evalNode.r4_approach_space}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.is_reachable_bfs ? 'text-emerald-400' : 'text-red-400 font-bold'
                          }`}>
                            {evalNode.is_reachable_bfs ? `Conectado (d=${evalNode.bfs_depth})` : 'AISLADO'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evalNode.status === 'COMPLIANT'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : evalNode.status === 'WARNING'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}>
                            {evalNode.is_orphan ? 'HUÉRFANO' : evalNode.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* --- TAB 3: GRAFO TOPOLÓGICO Y CONECTIVIDAD --- */}
          {activeTab === 'topology' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Visualización de conectividad espacial y accesibilidad desde Acceso Principal mediante algoritmo BFS.
                </span>
                <button
                  onClick={onOpenGraphModal}
                  className="flex items-center space-x-1 text-xs bg-sky-900 text-sky-300 px-2.5 py-1 rounded hover:bg-sky-800 transition-colors"
                >
                  <span>Abrir Visor Completo de Grafo</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {project.nodes.map(node => {
                  const evalNode = diagnostics.node_evaluations[node.node_id];
                  return (
                    <div
                      key={node.node_id}
                      onClick={() => onSelectEntity('node', node.node_id)}
                      className="bg-slate-900 p-2.5 rounded border border-slate-800 hover:border-sky-500 cursor-pointer text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{node.label}</span>
                        <span className={`text-[10px] font-mono font-bold ${
                          evalNode?.is_reachable_bfs ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {evalNode?.is_reachable_bfs ? '✓ Accesible' : '✗ Aislado'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Ruta BFS: {evalNode?.bfs_path ? evalNode.bfs_path.join(' → ') : 'Sin ruta'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- TAB 4: LOGS DEL MOTOR --- */}
          {activeTab === 'logs' && (
            <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-3 rounded border border-slate-800">
              {diagnostics.execution_logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.includes('FAIL') || log.includes('ERROR')
                      ? 'text-red-400'
                      : log.includes('WARN')
                      ? 'text-amber-400'
                      : log.includes('BFS') || log.includes('RESULT')
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
