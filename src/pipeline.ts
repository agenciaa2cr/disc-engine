import { scoreRawPass } from "./scoring/score.js";
import { scoreVectorToPercentiles, theoreticalNormTable, type NormTable } from "./scoring/norms.js";
import { computeAmplitude, computeFlexibility, computeTension, classifyPattern, findWeakest } from "./scoring/indices.js";
import { computeValidity } from "./scoring/validity.js";
import { computeJobFit } from "./jobfit/fit.js";
import { TETRAD_BLOCK_COUNT } from "./instrument/blocks.js";
import type { JobTarget, ProfileFacts, SessionResponses } from "./types.js";

export interface PipelineOptions {
  norms?: NormTable;
  jobTarget?: JobTarget;
}

/**
 * O pipeline inteiro, ponta a ponta: respostas brutas → fatos do perfil.
 * Nenhuma etapa depende de rede, banco ou serviço externo — dá para rodar
 * isso num laptop offline, o que é o ponto.
 */
export function computeProfileFacts(responses: SessionResponses, options: PipelineOptions = {}): ProfileFacts {
  const norms = options.norms ?? theoreticalNormTable();

  const rawAdapted = scoreRawPass(responses.adapted);
  const rawNatural = scoreRawPass(responses.natural);

  const percentileAdapted = scoreVectorToPercentiles(rawAdapted, "adapted", norms);
  const percentileNatural = scoreVectorToPercentiles(rawNatural, "natural", norms);

  const delta = computeTension(percentileAdapted, percentileNatural);
  const amplitude = computeAmplitude(percentileAdapted, percentileNatural);
  const flexibility = computeFlexibility(percentileAdapted, percentileNatural);
  const pattern = classifyPattern(percentileNatural, amplitude);
  const weakest = findWeakest(percentileNatural);

  const validity = computeValidity({
    adaptedResponses: responses.adapted,
    naturalResponses: responses.natural,
    anchorResponses: responses.anchors,
    expectedBlockCount: TETRAD_BLOCK_COUNT,
    percentileNatural,
  });

  const jobFit = options.jobTarget ? computeJobFit(percentileAdapted, options.jobTarget) : undefined;

  const facts: ProfileFacts = {
    raw: { adapted: rawAdapted, natural: rawNatural },
    percentile: { adapted: percentileAdapted, natural: percentileNatural },
    delta,
    amplitude,
    flexibility,
    pattern,
    weakest,
    validity,
  };
  if (jobFit) facts.jobFit = jobFit;
  return facts;
}
