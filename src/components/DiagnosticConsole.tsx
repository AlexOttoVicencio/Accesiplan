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
  theme: 'dark' | 'light';
  onSelectEntity: (type: 'node' | 'edge' | 'item' | null, id: string | null, subId?: string | null) => void;
  onOpenGraphModal: () => void;
}

export const DiagnosticConsole: React.FC<DiagnosticConsoleProps> = ({
  project,
  diagnostics,
  theme,
  onSelectEntity,
  onOpenGraphModal
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'violations' | 'topology' | 'logs'>('violations');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | ViolationSeverity>('ALL');

  const isDark = theme === 'dark';
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

  const panelBg = isDark ? 'bg-[#0B0F17] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800';
  const headerBg = isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-200';
  const contentBg = isDark ? 'bg-[#090D14]' : 'bg-[#F8FAFC]';
  const tabActiveBg = isDark ? 'bg-slate-800 text-sky-400 font-semibold' : 'bg-white text-sky-600 font-semibold shadow-sm border border-slate-200';
  return (
    <div className={`border-t flex flex-col transition-all duration-200 z-20 ${panelBg}`}>
      <div className={`h-10 px-4 flex items-center justify-between select-none border-b ${headerBg}`}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Motor de Diagnóstico Normativo OGUC</span>
          </div>

          <div className={`flex items-center space-x-2 px-2.5 py-0.5 rounded border ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
          }`}>
            <div
              className={`w-2 h-2 rounded-full ${
                diagnostics.compliance_percentage === 100
                  ? 'bg-emerald-500'
                  : diagnostics.compliance_percentage > 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-mono font-bold">
              {diagnostics.compliance_percentage}% Accesible
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
            <span className={`px-2 py-0.5 rounded border flex items-center space-x-1 ${
              isDark ? 'bg-red-950/80 text-red-400 border-red-800/60' : 'bg-red-50 text-red-700 border-red-300'
            }`}>
              <XCircle className="w-3 h-3" />
              <span>{blockingCount} Errores</span>
            </span>
            <span className={`px-2 py-0.5 rounded border flex items-center space-x-1 ${
              isDark ? 'bg-amber-950/80 text-amber-400 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              <span>{warningCount} Advertencias</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => { setActiveTab('violations'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'violations' && isExpanded ? tabActiveBg : 'opacity-60 hover:opacity-100'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Infracciones ({diagnostics.violations.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('matrix'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'matrix' && isExpanded ? tabActiveBg : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Matriz OGUC</span>
          </button>

          <button
            onClick={() => { setActiveTab('topology'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'topology' && isExpanded ? tabActiveBg : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Grafo Topológico</span>
          </button>

          <button
            onClick={() => { setActiveTab('logs'); setIsExpanded(true); }}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'logs' && isExpanded ? tabActiveBg : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="opacity-60 hover:opacity-100 p-1.5 ml-2 transition-opacity"
            title={isExpanded ? 'Minimizar consola' : 'Expandir consola'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className={`h-56 overflow-y-auto p-3 ${contentBg}`}>
          {activeTab === 'violations' && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs mb-2">
                <span className="opacity-60 font-medium">Filtrar por:</span>
                <button
                  onClick={() => setSeverityFilter('ALL')}
                  className={`px-2 py-0.5 rounded ${severityFilter === 'ALL' ? 'bg-sky-500 text-white font-bold' : 'opacity-70 hover:opacity-100'}`}
                >
                  Todas ({diagnostics.violations.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('BLOCKING_ERROR')}
                  className={`px-2 py-0.5 rounded ${severityFilter === 'BLOCKING_ERROR' ? 'bg-red-500 text-white font-bold' : 'opacity-70 hover:opacity-100'}`}
                >
                  Bloqueantes ({blockingCount})
                </button>
                <button
                  onClick={() => setSeverityFilter('WARNING')}
                  className={`px-2 py-0.5 rounded ${severityFilter === 'WARNING' ? 'bg-amber-500 text-white font-bold' : 'opacity-70 hover:opacity-100'}`}
                >
                  Advertencias ({warningCount})
                </button>
              </div>

              {filteredViolations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-500 space-y-1">
                  <ShieldCheck className="w-8 h-8" />
                  <span className="text-sm font-semibold">Sin Infracciones Normativas</span>
                  <span className="text-xs opacity-60">Todos los recintos, puertas y alturas cumplen con la OGUC D.S. 50.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredViolations.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 ${
                      v.severity === 'BLOCKING_ERROR'
                        ? isDark ? 'bg-red-950/20 border-red-900/60 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
                        : isDark ? 'bg-amber-950/20 border-amber-900/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
                          {v.severity === 'BLOCKING_ERROR' ? (
                            <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          )}
                          <span className="text-xs font-bold">{v.title}</span>
                        </div>
                        <span className="text-[10px] font-mono border px-1.5 py-0.5 rounded opacity-80">
                          {v.oguc_article}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-85">{v.description}</p>
                    </div>

                    <div className={`p-2 rounded border text-[11px] flex items-center justify-between ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="font-mono space-x-3">
                        <span>Actual: <strong className="text-red-500">{v.current_value}</strong></span>
                        <span>Exigido: <strong className="text-emerald-500">{v.required_value}</strong></span>
                      </div>
                      <button
                        onClick={() => handleLocateViolation(v)}
                        className="flex items-center space-x-1 text-[10px] text-sky-500 hover:underline font-semibold"
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

          {activeTab === 'matrix' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className={`border-b text-[11px] ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>
                    <th className="p-2">ID</th>
                    <th className="p-2">Recinto</th>
                    <th className="p-2">Dimensiones (WxL)</th>
                    <th className="p-2">Área</th>
                    <th className="p-2">R1 Puertas (=0.80)</th>
                    <th className="p-2">R2 Giro (Ø1.50)</th>
                    <th className="p-2">R3 Alturas Z</th>
                    <th className="p-2">R4 Transf.</th>
                    <th className="p-2">Ruta BFS</th>
                    <th className="p-2">Estado</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {project.nodes.map(node => {
                    const evalNode = diagnostics.node_evaluations[node.node_id];
                    if (!evalNode) return null;

                    return (
                      <tr
                        key={node.node_id}
                        onClick={() => onSelectEntity('node', node.node_id)}
                        className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-100'}`}
                      >
                        <td className="p-2 text-sky-500 font-bold">{node.node_id}</td>
                        <td className="p-2 font-sans font-medium">{node.label}</td>
                        <td className="p-2 text-slate-400">
                          {node.dimensions ? `${node.dimensions.width_m}x${node.dimensions.length_m}m` : '-'}
                        </td>
                        <td className="p-2">{evalNode.area_m2.toFixed(2)} m²</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r1_door_status === 'PASS' ? 'text-emerald-500 font-bold' : evalNode.r1_door_status === 'FAIL' ? 'text-red-500 font-bold' : 'opacity-40'
                          }`}>
                            {evalNode.r1_door_status}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r2_turning_radius === 'PASS' ? 'text-emerald-500 font-bold' : evalNode.r2_turning_radius === 'WARN' ? 'text-amber-500 font-bold' : 'opacity-40'
                          }`}>
                            {evalNode.r2_turning_radius}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r3_z_installation === 'PASS' ? 'text-emerald-500 font-bold' : evalNode.r3_z_installation === 'FAIL' ? 'text-red-500 font-bold' : 'opacity-40'
                          }`}>
                            {evalNode.r3_z_installation}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evalNode.r4_approach_space === 'PASS' ? 'text-emerald-500 font-bold' : evalNode.r4_approach_space === 'FAIL' ? 'text-red-500 font-bold' : 'opacity-40'
                          }`}>
                            {evalNode.r4_approach_space}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`text-[10px] ${evalNode.is_reachable_bfs ? 'text-emerald-500' : 'text-red-500 font-bold'}`}>
                            {evalNode.is_reachable_bfs ? `Conectado (d=${evalNode.bfs_depth})` : 'AISLADO'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            evalNode.status === 'COMPLIANT'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : evalNode.status === 'WARNING'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : 'bg-red-500/10 text-red-600 border-red-500/30'
                          }`}>
                            {!evalNode.has_door ? 'SIN PUERTA' : evalNode.is_orphan ? 'HUÉRFANO' : evalNode.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'topology' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-60">
                  Visualización de conectividad espacial y accesibilidad desde Acceso Principal.
                </span>
                <button
                  onClick={onOpenGraphModal}
                  className="flex items-center space-x-1 text-xs bg-sky-600 text-white px-2.5 py-1 rounded hover:bg-sky-500 transition-colors"
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
                      className={`p-2.5 rounded border cursor-pointer text-xs space-y-1 ${
                        isDark ? 'bg-slate-900 border-slate-800 hover:border-sky-500' : 'bg-white border-slate-200 hover:border-sky-500 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{node.label}</span>
                        <span className={`text-[10px] font-mono font-bold ${
                          evalNode?.is_reachable_bfs ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {evalNode?.is_reachable_bfs ? '? Conectado' : '? Aislado'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono opacity-60">
                        Ruta: {evalNode?.bfs_path ? evalNode.bfs_path.join(' ? ') : 'Sin ruta'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className={`space-y-1 font-mono text-[11px] p-3 rounded border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {diagnostics.execution_logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.includes('FAIL') || log.includes('ERROR')
                      ? 'text-red-500'
                      : log.includes('WARN')
                      ? 'text-amber-500'
                      : log.includes('BFS') || log.includes('RESULT')
                      ? 'text-emerald-500'
                      : 'opacity-70'
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
