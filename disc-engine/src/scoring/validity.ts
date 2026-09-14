import { DIMENSIONS } from "../types.js";
import type {
  AnchorResponse,
  Dimension,
  PercentileVector,
  SocialDesirabilityLevel,
  TetradResponse,
  ValidityFlag,
  ValidityReport,
} from "../types.js";
import { ANCHOR_ITEMS } from "../instrument/anchors.js";

const FLATLINE_THRESHOLD = 0.85; // uma dimensão escolhida como "mais" em ≥85% dos blocos
const FAST_RESPONSE_MS = 1200; // abaixo disso, suspeita de resposta sem leitura
const FAST_RATIO_FLAG_THRESHOLD = 0.35; // proporção de blocos "rápidos demais" que dispara o alerta
const CONSISTENCY_FLAG_THRESHOLD = 0.5;

export interface ValidityInput {
  adaptedResponses: readonly TetradResponse[];
  naturalResponses: readonly TetradResponse[];
  anchorResponses: readonly AnchorResponse[];
  expectedBlockCount: number;
  percentileNatural: PercentileVector;
}

function mostCounts(responses: readonly TetradResponse[]): Record<Dimension, number> {
  const counts: Record<Dimension, number> = { D: 0, I: 0, S: 0, C: 0 };
  for (const r of responses) counts[r.most] += 1;
  return counts;
}

function detectFlatline(responses: readonly TetradResponse[]): boolean {
  if (responses.length === 0) return false;
  const counts = mostCounts(responses);
  const max = Math.max(...DIMENSIONS.map((d) => counts[d]));
  return max / responses.length >= FLATLINE_THRESHOLD;
}

function fastResponseRatio(responses: readonly TetradResponse[]): number {
  const timed = responses.filter((r) => typeof r.responseMs === "number");
  if (timed.length === 0) return 0;
  const fast = timed.filter((r) => (r.responseMs as number) < FAST_RESPONSE_MS).length;
  return fast / timed.length;
}

/** Desejabilidade social: heurística simples baseada na literatura de que, em
 *  formato de escolha forçada sem calibração fina por item, afirmações de I
 *  e S tendem a ser lidas como socialmente mais confortáveis que as de D e C.
 *  É um proxy grosseiro — o tratamento correto é calibrar desejabilidade por
 *  item com dados reais, o que está fora do escopo desta versão. */
function socialDesirability(adapted: readonly TetradResponse[], natural: readonly TetradResponse[]): SocialDesirabilityLevel {
  const all = [...adapted, ...natural];
  if (all.length === 0) return "baixa";
  const counts = mostCounts(all);
  const warmShare = (counts.I + counts.S) / all.length;
  if (warmShare > 0.65) return "alta";
  if (warmShare > 0.55) return "media";
  return "baixa";
}

/** Índice de consistência: concordância entre as âncoras normativas (Likert)
 *  e o percentil ipsativo natural, dimensão a dimensão. 1 = concordância
 *  perfeita, 0 = discordância máxima. */
function consistencyIndex(anchorResponses: readonly AnchorResponse[], percentileNatural: PercentileVector): number {
  if (anchorResponses.length === 0) return 1; // sem âncoras respondidas, não penaliza — apenas não é possível checar
  const byDim: Record<Dimension, number[]> = { D: [], I: [], S: [], C: [] };
  for (const ar of anchorResponses) {
    const item = ANCHOR_ITEMS.find((a) => a.id === ar.itemId);
    if (!item) continue;
    byDim[item.dimension].push((ar.rating - 1) / 4); // normaliza 1–5 para 0–1
  }
  const diffs: number[] = [];
  for (const d of DIMENSIONS) {
    if (byDim[d].length === 0) continue;
    const anchorAvg = byDim[d].reduce((a, b) => a + b, 0) / byDim[d].length;
    const percentileNorm = percentileNatural[d] / 100;
    diffs.push(Math.abs(anchorAvg - percentileNorm));
  }
  if (diffs.length === 0) return 1;
  const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.max(0, 1 - meanDiff);
}

export function computeValidity(input: ValidityInput): ValidityReport {
  const flags: ValidityFlag[] = [];

  const incomplete =
    input.adaptedResponses.length < input.expectedBlockCount || input.naturalResponses.length < input.expectedBlockCount;
  if (incomplete) flags.push("respostas_incompletas");

  const flatline = detectFlatline(input.adaptedResponses) || detectFlatline(input.naturalResponses);
  if (flatline) flags.push("flatline");

  const fastAdapted = fastResponseRatio(input.adaptedResponses);
  const fastNatural = fastResponseRatio(input.naturalResponses);
  const combinedFastRatio =
    input.adaptedResponses.length + input.naturalResponses.length > 0
      ? (fastAdapted * input.adaptedResponses.length + fastNatural * input.naturalResponses.length) /
        (input.adaptedResponses.length + input.naturalResponses.length)
      : 0;
  if (combinedFastRatio >= FAST_RATIO_FLAG_THRESHOLD) flags.push("tempo_anomalo");

  const consistency = consistencyIndex(input.anchorResponses, input.percentileNatural);
  if (consistency < CONSISTENCY_FLAG_THRESHOLD) flags.push("baixa_consistencia");

  const desirability = socialDesirability(input.adaptedResponses, input.naturalResponses);
  if (desirability === "alta") flags.push("desejabilidade_social_alta");

  const valid = !incomplete && !(flatline && flags.includes("tempo_anomalo"));

  return {
    flags,
    consistencyIndex: Math.round(consistency * 100) / 100,
    socialDesirability: desirability,
    flatlineDetected: flatline,
    fastResponseRatio: Math.round(combinedFastRatio * 100) / 100,
    valid,
  };
}
