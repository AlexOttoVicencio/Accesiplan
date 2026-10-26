import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProjectData } from './types/oguc';
import { runDiagnostics } from './engine/diagnostics';
import {
  SAMPLE_PROJECT_COMPLIANT,
  SAMPLE_PROJECT_NON_COMPLIANT,
  SAMPLE_PROJECT_CLINIC,
  SAMPLE_PROJECT_EMPTY
} from './services/sampleData';
import { generateOgucReportPdf } from './services/pdfExporter';

import { TopNav } from './components/TopNav';
import { Canvas25D } from './components/Canvas25D';
import { Inspector } from './components/Inspector';
import { DiagnosticConsole } from './components/DiagnosticConsole';
import { ItemToolbar } from './components/ItemToolbar';
import { TopologicalGraphModal } from './components/TopologicalGraphModal';

export const App: React.FC = () => {
  // Estado del Proyecto
  const [project, setProject] = useState<ProjectData>(SAMPLE_PROJECT_COMPLIANT);

  // Tema: Modo Oscuro (predeterminado) o Modo Claro
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modo de Visualización (Planta 2D vs Axonometría Isométrica 2.5D)
  const [viewMode, setViewMode] = useState<'2D' | '2.5D'>('2D');

  // Selección Contextual
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'node' | 'edge' | 'item' | null;
    id: string | null;
    subId?: string | null;
  }>({ type: null, id: null });

  // Toggles de Capas Técnicas
  const [showTurningRadius, setShowTurningRadius] = useState<boolean>(true);
  const [showTransferZones, setShowTransferZones] = useState<boolean>(true);
  const [showBfsPaths, setShowBfsPaths] = useState<boolean>(true);
  const [showCotas, setShowCotas] = useState<boolean>(true);
  const [showZHeights, setShowZHeights] = useState<boolean>(true);
  const [snapGrid, setSnapGrid] = useState<number>(0.10);

  // Modal del Grafo Topológico
  const [isGraphModalOpen, setIsGraphModalOpen] = useState<boolean>(false);

  // Referencia al Canvas para Captura de Informe PDF
  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);

  // Sincronizar clase 'dark' en el elemento raíz HTML
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Ejecución en Tiempo Real del Motor de Diagnóstico Normativo OGUC
  const diagnostics = useMemo(() => {
    return runDiagnostics(project);
  }, [project]);

  // Manejador de Selección de Entidad
  const handleSelectEntity = (
    type: 'node' | 'edge' | 'item' | null,
    id: string | null,
    subId?: string | null
  ) => {
    setSelectedEntity({ type, id, subId });
  };

  // Alternar Tema Claro / Oscuro
  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Carga de Plantillas Preconfiguradas
  const handleSelectPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'COMPLIANT':
        setProject(SAMPLE_PROJECT_COMPLIANT);
        break;
      case 'NON_COMPLIANT':
        setProject(SAMPLE_PROJECT_NON_COMPLIANT);
        break;
      case 'CLINIC':
        setProject(SAMPLE_PROJECT_CLINIC);
        break;
      case 'EMPTY':
        setProject(SAMPLE_PROJECT_EMPTY);
        break;
      default:
        break;
    }
    setSelectedEntity({ type: null, id: null });
  };

  // Exportación del Informe Oficial OGUC en PDF
  const handleExportPdf = async () => {
    let snapshotDataUrl: string | undefined = undefined;
    if (canvasDomRef.current) {
      snapshotDataUrl = canvasDomRef.current.toDataURL('image/png');
    }
    await generateOgucReportPdf(project, diagnostics, snapshotDataUrl);
  };

  // Exportación del Proyecto en JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.project_id || 'accesiplan_project'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importación del Proyecto desde JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.nodes)) {
            setProject(parsed);
            setSelectedEntity({ type: null, id: null });
          } else {
            alert('Formato de archivo JSON inválido para AccesiPlan.');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col w-screen h-screen overflow-hidden select-none font-sans transition-colors ${
      isDark ? 'bg-[#0A0D14] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      {/* 1. Barra de Navegación Superior */}
      <TopNav
        project={project}
        diagnostics={diagnostics}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        showTurningRadius={showTurningRadius}
        onToggleTurningRadius={() => setShowTurningRadius(!showTurningRadius)}
        showTransferZones={showTransferZones}
        onToggleTransferZones={() => setShowTransferZones(!showTransferZones)}
        showBfsPaths={showBfsPaths}
        onToggleBfsPaths={() => setShowBfsPaths(!showBfsPaths)}
        showCotas={showCotas}
        onToggleCotas={() => setShowCotas(!showCotas)}
        showZHeights={showZHeights}
        onToggleZHeights={() => setShowZHeights(!showZHeights)}
        onSelectPreset={handleSelectPreset}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* 2. Cuerpo Principal (Lienzo Central + Inspector Derecho) */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 h-full relative overflow-hidden">
          <Canvas25D
            project={project}
            diagnostics={diagnostics}
            viewMode={viewMode}
            theme={theme}
            selectedEntity={selectedEntity}
            onSelectEntity={handleSelectEntity}
            onUpdateProject={setProject}
            showTurningRadius={showTurningRadius}
            showTransferZones={showTransferZones}
            showBfsPaths={showBfsPaths}
            showCotas={showCotas}
            showZHeights={showZHeights}
            snapGrid={snapGrid}
            canvasRefCallback={(ref) => { canvasDomRef.current = ref; }}
          />

          <ItemToolbar
            project={project}
            theme={theme}
            onUpdateProject={setProject}
            onSelectEntity={handleSelectEntity}
          />
        </div>

        <Inspector
          project={project}
          diagnostics={diagnostics}
          theme={theme}
          selectedEntity={selectedEntity}
          onSelectEntity={handleSelectEntity}
          onUpdateProject={setProject}
        />
      </div>

      {/* 3. Consola y Motor de Diagnóstico Normativo Inferior */}
      <DiagnosticConsole
        project={project}
        diagnostics={diagnostics}
        theme={theme}
        onSelectEntity={handleSelectEntity}
        onOpenGraphModal={() => setIsGraphModalOpen(true)}
      />

      {/* Modal del Grafo Topológico */}
      <TopologicalGraphModal
        project={project}
        diagnostics={diagnostics}
        theme={theme}
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
        onSelectNode={(nodeId) => handleSelectEntity('node', nodeId)}
      />
    </div>
  );
};
