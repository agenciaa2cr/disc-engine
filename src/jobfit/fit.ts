import { DIMENSIONS } from "../types.js";
import type { Dimension, JobFitReport, JobTarget, PercentileVector } from "../types.js";

/**
 * Aderência à vaga: distância ponderada entre o perfil do candidato (Gráfico
 * I — adaptado, porque é o comportamento esperado no ambiente de trabalho)
 * e o perfil-alvo definido para a vaga.
 *
 * Isto é um cálculo de distância, não uma nota eliminatória — o produto não
 * expõe corte automático por aderência (ver seção de conformidade da
 * proposta). O número existe para orientar o roteiro de entrevista, não
 * para reprovar ninguém sozinho.
 */
export function computeJobFit(candidateAdapted: PercentileVector, target: JobTarget): JobFitReport {
  const weights = normalizeWeights(target.weights);
  const gaps = {} as Record<Dimension, number>;
  let weightedDistance = 0;

  for (const d of DIMENSIONS) {
    gaps[d] = candidateAdapted[d] - target.profile[d];
    weightedDistance += weights[d] * Math.abs(gaps[d]);
  }

  const overall = Math.round(Math.max(0, 100 - weightedDistance));
  const band = overall >= 75 ? "alta" : overall >= 50 ? "moderada" : "baixa";

  return { roleName: target.roleName, overall, gaps, band };
}

function normalizeWeights(input?: Partial<Record<Dimension, number>>): Record<Dimension, number> {
  const raw: Record<Dimension, number> = { D: input?.D ?? 1, I: input?.I ?? 1, S: input?.S ?? 1, C: input?.C ?? 1 };
  const sum = DIMENSIONS.reduce((acc, d) => acc + raw[d], 0) || 1;
  const out = {} as Record<Dimension, number>;
  for (const d of DIMENSIONS) out[d] = raw[d] / sum;
  return out;
}
