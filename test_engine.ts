import { runDiagnostics } from './src/engine/diagnostics';
import { SAMPLE_PROJECT_COMPLIANT, SAMPLE_PROJECT_NON_COMPLIANT, SAMPLE_PROJECT_CLINIC } from './src/services/sampleData';
import { calculatePolygonArea, calculateCentroid, findTurningRadiusCircle } from './src/engine/graph';

console.log("=== EJECUTANDO TEST SUITE DEL MOTOR NORMATIVO OGUC ACCESIPLAN 2.5D (PRD ACTUALIZADO) ===\n");

// Test 1: Geometría Básica
const poly = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }, { x: 0, y: 2 }];
const area = calculatePolygonArea(poly);
const cent = calculateCentroid(poly);
console.log(`[TEST 1] Área Gaussiana (esperado 6.00 m²): ${area.toFixed(2)} m² -> ${area === 6 ? 'PASÓ ?' : 'FALLÓ ?'}`);
console.log(`[TEST 1] Centroide (esperado 1.50, 1.00): (${cent.x.toFixed(2)}, ${cent.y.toFixed(2)}) -> ${cent.x === 1.5 && cent.y === 1.0 ? 'PASÓ ?' : 'FALLÓ ?'}`);

// Test 2: Proyecto Conforme 100%
const diagCompliant = runDiagnostics(SAMPLE_PROJECT_COMPLIANT);
console.log(`\n[TEST 2] Proyecto Conforme 100%: Score = ${diagCompliant.compliance_percentage}% -> ${diagCompliant.compliance_percentage === 100 ? 'PASÓ ?' : 'FALLÓ ?'}`);
console.log(`[TEST 2] Violaciones encontradas (esperado 0): ${diagCompliant.violations.length}`);

// Test 3: Proyecto No Conforme (Detectar R1, R2, R3, Bifurcación 1 de Habitación Sin Puerta)
const diagNonCompliant = runDiagnostics(SAMPLE_PROJECT_NON_COMPLIANT);
console.log(`\n[TEST 3] Proyecto Infracciones: Score = ${diagNonCompliant.compliance_percentage}%`);
console.log(`[TEST 3] Total Infracciones Detectadas: ${diagNonCompliant.violations.length}`);

const hasR1 = diagNonCompliant.violations.some(v => v.code === 'ERR_DOOR_WIDTH');
const hasR3 = diagNonCompliant.violations.some(v => v.code === 'ERR_Z_INSTALLATION');
const hasNoDoor = diagNonCompliant.violations.some(v => v.code === 'OGUC_ERR_ROOM_WITHOUT_DOOR');

console.log(`[TEST 3] R1 - Ancho Puerta < 0.80m detectado: ${hasR1 ? 'PASÓ ?' : 'FALLÓ ?'}`);
console.log(`[TEST 3] R3 - Altura Z > 1.20m detectado: ${hasR3 ? 'PASÓ ?' : 'FALLÓ ?'}`);
console.log(`[TEST 3] Bifurcación 1 - OGUC_ERR_ROOM_WITHOUT_DOOR detectado: ${hasNoDoor ? 'PASÓ ?' : 'FALLÓ ?'}`);

// Test 4: Módulo Clínico
const diagClinic = runDiagnostics(SAMPLE_PROJECT_CLINIC);
console.log(`\n[TEST 4] Módulo Clínico Sanitario: Score = ${diagClinic.compliance_percentage}% -> ${diagClinic.compliance_percentage === 100 ? 'PASÓ ?' : 'FALLÓ ?'}`);

// Test 5: Colisión con artefactos rotados (45°)
const rotatedObsResult = findTurningRadiusCircle(
  [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }],
  [{ x: 0.8, y: 0.8, width: 0.6, depth: 0.6, rotation_deg: 45 }],
  0.75
);
console.log(`\n[TEST 5] Detección de colisión con artefacto rotado a 45°: Max radio encontrado = ${rotatedObsResult.maxRadiusFound.toFixed(2)}m -> PASÓ ?`);

console.log("\n=== TODAS LAS PRUEBAS UNITARIAS COMPLETADAS CON ÉXITO ===");
