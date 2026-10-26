import React from 'react';
import {
  ProjectData,
  DiagnosticResult
} from '../types/oguc';
import {
  FileDown,
  Layers,
  Box,
  Square,
  CircleDot,
  Maximize2,
  FolderOpen,
  HelpCircle,
  FileCode,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface TopNavProps {
  project: ProjectData;
  diagnostics: DiagnosticResult;
  viewMode: '2D' | '2.5D';
  onToggleViewMode: (mode: '2D' | '2.5D') => void;
  showTurningRadius: boolean;
  onToggleTurningRadius: () => void;
  showTransferZones: boolean;
  onToggleTransferZones: () => void;
  showBfsPaths: boolean;
  onToggleBfsPaths: () => void;
  showCotas: boolean;
  onToggleCotas: () => void;
  showZHeights: boolean;
  onToggleZHeights: () => void;
  onSelectPreset: (presetKey: string) => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  project,
  diagnostics,
  viewMode,
  onToggleViewMode,
  showTurningRadius,
  onToggleTurningRadius,
  showTransferZones,
  onToggleTransferZones,
  showBfsPaths,
  onToggleBfsPaths,
  showCotas,
  onToggleCotas,
  showZHeights,
  onToggleZHeights,
  onSelectPreset,
  onExportPdf,
  onExportJson,
  onImportJson
}) => {
  return (
    <header className="h-14 bg-[#0F172A] border-b border-slate-800 px-4 flex items-center justify-between select-none z-30 shadow-md">
      {/* Brand & Nombre Conceptual */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-white font-sans">
                AccesiPlan <span className="text-emerald-400 font-mono">2.5D</span>
              </h1>
              <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                OGUC D.S.50
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Diseño habitacional sin barreras: validación espacial e inmediata
            </p>
          </div>
        </div>

        {/* Selector de Plantillas Preconfiguradas */}
        <div className="hidden lg:flex items-center space-x-1.5 ml-4 pl-4 border-l border-slate-800">
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <select
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded px-2.5 py-1 outline-none font-medium hover:border-sky-500 transition-colors"
            defaultValue=""
          >
            <option value="" disabled>Cargar Plantilla Normativa...</option>
            <option value="COMPLIANT">Depto. Accesible Universal (100% Conforme)</option>
            <option value="NON_COMPLIANT">Planta con Infracciones Típicas (Para Remediación)</option>
            <option value="CLINIC">Módulo Sanitario Clínico Inclusivo</option>
            <option value="EMPTY">Lienzo en Blanco</option>
          </select>
        </div>
      </div>

      {/* Selector de Modos 2D / 2.5D & Capas Técnicas */}
      <div className="flex items-center space-x-2">
        {/* Toggle 2D / 2.5D */}
        <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
          <button
            onClick={() => onToggleViewMode('2D')}
            className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all ${
              viewMode === '2D'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Planta 2D</span>
          </button>
          <button
            onClick={() => onToggleViewMode('2.5D')}
            className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all ${
              viewMode === '2.5D'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Axonometría 2.5D</span>
          </button>
        </div>

        {/* Toggles de Capas */}
        <div className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={onToggleTurningRadius}
            title="Mostrar/Ocultar Radio de Giro D=1.50m (R2)"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showTurningRadius ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CircleDot className="w-3 h-3" />
            <span>Giro Ø1.50m</span>
          </button>

          <button
            onClick={onToggleTransferZones}
            title="Mostrar/Ocultar Zonas de Transferencia Inodoros (R4)"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showTransferZones ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Transf. 0.8x1.2</span>
          </button>

          <button
            onClick={onToggleBfsPaths}
            title="Mostrar/Ocultar Rutas BFS de Accesibilidad"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showBfsPaths ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Rutas BFS</span>
          </button>

          <button
            onClick={onToggleZHeights}
            title="Mostrar/Ocultar Cotas de Altura Z (R3)"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showZHeights ? 'bg-purple-950/80 text-purple-300 border border-purple-800/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Cotas Z</span>
          </button>
        </div>
      </div>

      {/* Botones de Acción (PDF & JSON) */}
      <div className="flex items-center space-x-2">
        <label className="cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded flex items-center space-x-1.5 transition-colors">
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Importar</span>
          <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
        </label>

        <button
          onClick={onExportJson}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
          title="Guardar archivo JSON"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">JSON</span>
        </button>

        <button
          onClick={onExportPdf}
          className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <FileDown className="w-4 h-4" />
          <span>Exportar Informe PDF</span>
        </button>
      </div>
    </header>
  );
};
