import { runDiagnostics } from './src/engine/diagnostics';
import { SAMPLE_PROJECT_COMPLIANT } from './src/services/sampleData';

const diag = runDiagnostics(SAMPLE_PROJECT_COMPLIANT);
console.log("Violaciones en SAMPLE_PROJECT_COMPLIANT:", JSON.stringify(diag.violations, null, 2));
