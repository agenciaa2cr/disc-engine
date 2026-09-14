// Superfície pública da suíte — módulos de domínio, independentes entre si
// exceto onde a integração é intencional (ex.: AtsService.hire cria uma
// Person via CoreService). Cada módulo pode ser testado e evoluído sem
// mexer nos outros.

export { createEntityStore, type Entity, type EntityQuery, type EntityStore } from "./store/index.js";

export { CoreService } from "./core/service.js";
export * from "./core/types.js";

export { AtsService, TransitionError } from "./ats/service.js";
export { canTransition, nextStage, isTerminal } from "./ats/pipeline.js";
export * from "./ats/types.js";

export { PerformanceService, GoalError } from "./performance/service.js";
export { boxNumber, boxLabel } from "./performance/nine-box.js";
export * from "./performance/types.js";

export { ClimateService, SurveyError } from "./climate/service.js";
export { computeDomainRiskScores, computeEnps, type DomainRiskResult, type EnpsResult, type RiskBand } from "./climate/aggregate.js";
export { PSYCHOSOCIAL_ITEMS, PSYCHOSOCIAL_DOMAIN_LABELS, RESPONSE_SCALE } from "./climate/psychosocial-questionnaire.js";
export * from "./climate/types.js";

export { TrainingService } from "./training/service.js";
export * from "./training/types.js";

export * as analytics from "./analytics/queries.js";
