// Superfície pública do pacote — o que a aplicação (Next.js, Fase 2) ou
// qualquer outro consumidor deveria importar. O resto de src/ é
// implementação interna e pode mudar sem aviso; isto aqui é o contrato.

export * from "./types.js";
export { computeProfileFacts } from "./pipeline.js";
export { buildSessionPlan, orderedBlocksForPass, orderedAnchors, PASS_INSTRUCTIONS } from "./instrument/session.js";
export { TETRAD_BLOCKS, TETRAD_BLOCK_COUNT } from "./instrument/blocks.js";
export { ANCHOR_ITEMS } from "./instrument/anchors.js";
export { buildReport, buildAllReports } from "./reports/report.js";
export { renderReportHtml } from "./reports/render.js";
export { htmlToPdf } from "./reports/pdf.js";
export { computeTeamSummary, type TeamSummary } from "./reports/team.js";
export { computeJobFit } from "./jobfit/fit.js";
export { CONTENT_LIBRARY, CONTENT_LIBRARY_VERSION, AUDIENCE_LAYERS } from "./content/library.js";
export { ENGINE_VERSION } from "./version.js";
