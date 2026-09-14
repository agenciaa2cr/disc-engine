import { PSYCHOSOCIAL_ITEMS, type PsychosocialDomain } from "./psychosocial-questionnaire.js";
import type { SurveyResponseInput } from "./types.js";

export type RiskBand = "baixo" | "medio" | "alto";

export interface DomainRiskResult {
  domain: PsychosocialDomain;
  /** 0–100, onde 100 = risco máximo — já com a inversão de itens "reversed" aplicada */
  score: number;
  band: RiskBand;
  responseCount: number;
  /** true só no domínio "comportamentos_ofensivos": qualquer exposição
   *  relatada (média > 0) dispara isto independente da faixa — assédio e
   *  violência não são "risco baixo" só porque a média ficou baixa. */
  criticalExposureFlag: boolean;
}

/**
 * Cortes de risco PROVISÓRIOS (tercis ingênuos sobre a escala 0–100), a
 * substituir por norma real assim que houver amostra — mesmo tratamento
 * dado à norma teórica do DISC 2.0. Não apresente isto como corte
 * validado cientificamente numa auditoria de verdade sem antes calibrar.
 */
const RISK_BAND_THRESHOLDS: Record<RiskBand, number> = { baixo: 33, medio: 66, alto: 100 };

function bandFor(score: number): RiskBand {
  if (score < RISK_BAND_THRESHOLDS.baixo) return "baixo";
  if (score < RISK_BAND_THRESHOLDS.medio) return "medio";
  return "alto";
}

/** Anonimato aplicado ANTES de qualquer outro cálculo: um grupo de
 *  respostas com menos que `threshold` entradas é descartado inteiro —
 *  não some anonimizado, simplesmente não entra no resultado. */
export function enforceAnonymity<T extends { length: number }>(responses: T, threshold: number): boolean {
  return responses.length >= threshold;
}

export function computeDomainRiskScores(responses: readonly SurveyResponseInput[], threshold: number): DomainRiskResult[] | undefined {
  if (!enforceAnonymity(responses, threshold)) return undefined;

  const domains = Array.from(new Set(PSYCHOSOCIAL_ITEMS.map((i) => i.domain)));
  return domains.map((domain) => {
    const items = PSYCHOSOCIAL_ITEMS.filter((i) => i.domain === domain);
    const values: number[] = [];
    const rawOffensiveValues: number[] = [];

    for (const resp of responses) {
      for (const item of items) {
        const raw = resp.answers[item.id];
        if (typeof raw !== "number") continue;
        const normalized = item.reversed ? 4 - raw : raw; // 0–4, sempre "quanto maior, mais risco" após normalizar
        values.push(normalized);
        if (domain === "comportamentos_ofensivos") rawOffensiveValues.push(raw); // aqui queremos o valor cru, não invertido
      }
    }

    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const score = Math.round((avg / 4) * 100);
    const criticalExposureFlag = domain === "comportamentos_ofensivos" && rawOffensiveValues.some((v) => v > 0);

    return { domain, score, band: bandFor(score), responseCount: responses.length, criticalExposureFlag };
  });
}

// ---------------------------------------------------------------------------
// eNPS
// ---------------------------------------------------------------------------
export interface EnpsResult {
  score: number; // -100 a 100
  promoters: number;
  passives: number;
  detractors: number;
  responseCount: number;
}

export function computeEnps(scores: readonly number[], threshold: number): EnpsResult | undefined {
  if (!enforceAnonymity(scores, threshold)) return undefined;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const passives = scores.length - promoters - detractors;
  const score = Math.round(((promoters - detractors) / scores.length) * 100);
  return { score, promoters, passives, detractors, responseCount: scores.length };
}
