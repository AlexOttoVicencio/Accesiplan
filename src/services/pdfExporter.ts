import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectData, DiagnosticResult, NODE_TYPE_LABELS } from '../types/oguc';

export async function generateOgucReportPdf(
  project: ProjectData,
  diagnostics: DiagnosticResult,
  canvasSnapshotDataUrl?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 15;

  // Encabezado Oficial Sobrio y Profesional
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ACCESIPLAN 2.5D | INFORME TÉCNICO DE ACCESIBILIDAD', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Validación Espacial y Topológica Normativa | OGUC Chile D.S. 50 - Título 2 Cap. 2', 14, 18);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, 14, 23);

  // Badge de Estado Global (plano y estático)
  const isPass = diagnostics.compliance_percentage === 100;
  doc.setFillColor(isPass ? 16 : 239, isPass ? 185 : 68, isPass ? 129 : 68);
  doc.roundedRect(pageWidth - 65, 8, 51, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`CUMPLIMIENTO: ${diagnostics.compliance_percentage}%`, pageWidth - 61, 17);

  currentY = 36;

  // 1. Ficha del Proyecto
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. FICHA TÉCNICA DEL PROYECTO', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Parámetro', 'Detalle Registrado', 'Parámetro', 'Detalle Registrado']],
    body: [
      ['Proyecto:', project.project_name, 'ID Proyecto:', project.project_id],
      ['Marco Normativo:', 'OGUC Chile D.S. 50 / Art. 2.2.8 y 4.1.7', 'Nivel / Piso:', `Nivel ${project.building_level}`],
      ['Responsable:', project.author || 'Profesional Competente', 'Total Recintos:', `${project.nodes.length} recintos (${project.edges.length} puertas)`]
    ],
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { cellWidth: 63 },
      2: { fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;
  // 2. Resumen Ejecutivo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. RESUMEN EJECUTIVO Y MÉTRICAS DE ACCESIBILIDAD', 14, currentY);
  currentY += 4;

  const kpis = [
    { label: 'Recintos Conformes', value: `${diagnostics.compliant_nodes} / ${diagnostics.total_nodes}`, color: [16, 185, 129] },
    { label: 'Infracciones Bloqueantes', value: `${diagnostics.violations.filter(v => v.severity === 'BLOCKING_ERROR').length}`, color: [239, 68, 68] },
    { label: 'Advertencias Ergonomía', value: `${diagnostics.violations.filter(v => v.severity === 'WARNING').length}`, color: [245, 158, 11] },
    { label: 'Nodos Huérfanos/Sin Puerta', value: `${diagnostics.orphan_nodes}`, color: [239, 68, 68] }
  ];

  const boxWidth = (pageWidth - 28 - 9) / 4;
  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, 16, 2, 2, 'FD');

    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, currentY, 3, 16, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 5, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 5, currentY + 13);
  });

  currentY += 22;

  // 3. Captura Gráfica del Plano 2.5D
  if (canvasSnapshotDataUrl) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('3. REGISTRO GRÁFICO DEL PLANO VECTORIAL 2.5D', 14, currentY);
    currentY += 4;

    const imgWidth = pageWidth - 28;
    const imgHeight = 65;
    try {
      doc.addImage(canvasSnapshotDataUrl, 'PNG', 14, currentY, imgWidth, imgHeight);
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, currentY, imgWidth, imgHeight, 'D');
      currentY += imgHeight + 8;
    } catch (e) {
      console.warn('Could not add image snapshot to PDF', e);
    }
  }

  // 4. Matriz de Cumplimiento
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('4. MATRIZ DE CUMPLIMIENTO TOPOLÓGICO Y NORMATIVO', 14, currentY);
  currentY += 4;

  const nodeRows = project.nodes.map(node => {
    const evalData = diagnostics.node_evaluations[node.node_id];
    const statusText = !evalData.has_door
      ? 'SIN PUERTA'
      : evalData.status === 'COMPLIANT'
      ? 'CONFORME'
      : evalData.status === 'WARNING'
      ? 'CON ADVERTENCIA'
      : evalData.status === 'ORPHAN'
      ? 'AISLADO'
      : 'NO CONFORME';

    const dims = node.dimensions ? `${node.dimensions.width_m}x${node.dimensions.length_m}m` : '-';
    const r1 = evalData.r1_door_status === 'PASS' ? 'CUMPLE (>=0.80)' : evalData.r1_door_status === 'FAIL' ? 'FALLA (<0.80)' : 'N/A';
    const r2 = evalData.r2_turning_radius === 'PASS' ? 'CUMPLE (1.50m)' : evalData.r2_turning_radius === 'WARN' ? 'INSUFICIENTE' : 'N/A';
    const r3 = evalData.r3_z_installation === 'PASS' ? 'CUMPLE' : evalData.r3_z_installation === 'FAIL' ? 'FALLA' : 'N/A';
    const r4 = evalData.r4_approach_space === 'PASS' ? 'CUMPLE' : evalData.r4_approach_space === 'FAIL' ? 'FALLA' : 'N/A';
    const bfs = evalData.is_reachable_bfs ? 'ACCESIBLE (BFS)' : 'BLOQUEADO';

    return [
      node.node_id,
      node.label,
      dims,
      `${evalData.area_m2.toFixed(2)} m²`,
      r1,
      r2,
      r3,
      r4,
      bfs,
      statusText
    ];
  });

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['ID', 'Recinto', 'Dim. (WxL)', 'Área', 'R1 Puertas', 'R2 Giro', 'R3 Z', 'R4 Transf.', 'Ruta BFS', 'Estado']],
    body: nodeRows,
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Registro Detallado de Infracciones
  if (diagnostics.violations.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('5. REGISTRO DETALLADO DE INFRACCIONES Y RECOMENDACIONES TÉCNICAS', 14, currentY);
    currentY += 4;

    const violationRows = diagnostics.violations.map(v => [
      v.severity === 'BLOCKING_ERROR' ? 'ERROR BLOQUEANTE' : 'ADVERTENCIA',
      v.oguc_article,
      v.title,
      `Actual: ${v.current_value}\nExigido: ${v.required_value}`,
      v.suggested_fix
    ]);

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['Severidad', 'Artículo OGUC', 'Descripción del Hallazgo', 'Parámetros', 'Propuesta de Remediación']],
      body: violationRows,
      headStyles: { fillColor: [153, 27, 27], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { fontStyle: 'bold', cellWidth: 32 },
        2: { cellWidth: 46 },
        3: { cellWidth: 36 },
        4: { cellWidth: 42 }
      },
      margin: { left: 14, right: 14 }
    });
  }

  // Pie de Página
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `AccesiPlan 2.5D - Software de Validación Normativa OGUC Chile | Página ${i} de ${totalPages}`,
      14,
      pageHeight - 8
    );
    doc.text(
      'Documento oficial generado conforme al Decreto Supremo N° 50 (V. y U.) de Accesibilidad Universal.',
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  const filename = `Informe_Accesibilidad_OGUC_${project.project_id}_${Date.now()}.pdf`;
  doc.save(filename);
}
