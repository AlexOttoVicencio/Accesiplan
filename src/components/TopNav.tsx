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
  FolderOpen,
  FileCode,
  Sun,
  Moon
} from 'lucide-react';

interface TopNavProps {
  project: ProjectData;
  diagnostics: DiagnosticResult;
  viewMode: '2D' | '2.5D';
  onToggleViewMode: (mode: '2D' | '2.5D') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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
  const isDark = theme === 'dark';

  return (
    <header className={`h-14 px-4 flex items-center justify-between select-none z-30 border-b transition-colors ${
      isDark ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Brand & Identidad */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center shadow">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-tight font-sans">
                AccesiPlan <span className="text-emerald-500 font-mono">2.5D</span>
              </h1>
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded font-semibold ${
                isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                OGUC D.S.50
              </span>
            </div>
            <p className="text-[10px] opacity-60 hidden md:block">
              Diseño habitacional sin barreras: validación espacial e inmediata
            </p>
          </div>
        </div>

        {/* Selector de Plantillas */}
        <div className={`hidden lg:flex items-center space-x-1.5 ml-4 pl-4 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <FolderOpen className="w-3.5 h-3.5 opacity-60" />
          <select
            onChange={(e) => onSelectPreset(e.target.value)}
            className={`border text-xs rounded px-2.5 py-1 outline-none font-medium transition-colors ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}
            defaultValue=""
          >
            <option value="" disabled>Cargar Plantilla...</option>
            <option value="COMPLIANT">Depto. Accesible Universal (100% Conforme)</option>
            <option value="NON_COMPLIANT">Planta con Infracciones y Nodo Sin Puerta</option>
            <option value="CLINIC">Módulo Sanitario Clínico Inclusivo</option>
            <option value="EMPTY">Lienzo en Blanco</option>
          </select>
        </div>
      </div>

      {/* Selector 2D/2.5D & Capas Técnicas */}
      <div className="flex items-center space-x-2">
        {/* Toggle 2D / 2.5D */}
        <div className={`p-0.5 rounded-lg border flex items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
          <button
            onClick={() => onToggleViewMode('2D')}
            className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all ${
              viewMode === '2D'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>2D</span>
          </button>
          <button
            onClick={() => onToggleViewMode('2.5D')}
            className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all ${
              viewMode === '2.5D'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>2.5D</span>
          </button>
        </div>

        {/* Toggles de Capas */}
        <div className={`hidden md:flex items-center space-x-1 p-1 rounded-lg border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-300'
        }`}>
          <button
            onClick={onToggleTurningRadius}
            title="Mostrar/Ocultar Radio de Giro D=1.50m (R2)"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showTurningRadius
                ? isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80' : 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <CircleDot className="w-3 h-3" />
            <span>Giro Ø1.50m</span>
          </button>

          <button
            onClick={onToggleTransferZones}
            title="Mostrar/Ocultar Zonas de Transferencia (R4)"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showTransferZones
                ? isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Transf. 0.8x1.2</span>
          </button>

          <button
            onClick={onToggleBfsPaths}
            title="Mostrar/Ocultar Flujo BFS"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showBfsPaths
                ? isDark ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80' : 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <span>Rutas BFS</span>
          </button>

          <button
            onClick={onToggleZHeights}
            title="Mostrar/Ocultar Cotas de Altura Z (R3)"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 font-mono transition-colors ${
              showZHeights
                ? isDark ? 'bg-purple-950/80 text-purple-300 border border-purple-800/80' : 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <span>Cotas Z</span>
          </button>
        </div>
      </div>

      {/* Botones de Acción (Tema, JSON y PDF) */}
      <div className="flex items-center space-x-2">
        {/* Toggle Tema Claro / Oscuro */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className={`p-1.5 rounded-lg border transition-colors ${
            isDark ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <label className={`cursor-pointer text-xs px-2.5 py-1.5 rounded border flex items-center space-x-1.5 transition-colors ${
          isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
        }`}>
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Importar</span>
          <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
        </label>

        <button
          onClick={onExportJson}
          className={`text-xs px-2.5 py-1.5 rounded border flex items-center space-x-1.5 transition-colors ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
          title="Guardar archivo JSON"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">JSON</span>
        </button>

        <button
          onClick={onExportPdf}
          className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <FileDown className="w-4 h-4" />
          <span>Informe PDF</span>
        </button>
      </div>
    </header>
  );
};
