import { DIMENSIONS } from "../types.js";
import type { Dimension, PercentileVector, ProfileFacts } from "../types.js";

/**
 * Relatório de equipe: agregado sobre um conjunto de perfis, não um laudo
 * individual. É deliberadamente mais simples que o laudo por pessoa — não
 * usa a biblioteca de conteúdo condicional, só estatística descritiva —
 * porque o objetivo aqui é composição do time, não a leitura de ninguém em
 * particular. O relatório NUNCA identifica quem é quem: nenhum campo daqui
 * carrega nome ou id de pessoa, só contagens agregadas.
 */
export interface TeamSummary {
  peopleCount: number;
  avgPercentile: { adapted: PercentileVector; natural: PercentileVector };
  primaryDimensionDistribution: Record<Dimension, number>;
  patternDistribution: Record<string, number>;
  highTensionCount: number;
  narrowAmplitudeCount: number;
  narrative: string[];
}

export function computeTeamSummary(factsList: readonly ProfileFacts[]): TeamSummary {
  const peopleCount = factsList.length;
  const avgAdapted = averageVector(factsList.map((f) => f.percentile.adapted));
  const avgNatural = averageVector(factsList.map((f) => f.percentile.natural));

  const primaryDimensionDistribution: Record<Dimension, number> = { D: 0, I: 0, S: 0, C: 0 };
  const patternDistribution: Record<string, number> = {};
  let highTensionCount = 0;
  let narrowAmplitudeCount = 0;

  for (const f of factsList) {
    primaryDimensionDistribution[f.pattern.primary] += 1;
    patternDistribution[f.pattern.label] = (patternDistribution[f.pattern.label] ?? 0) + 1;
    if (f.delta.level === "alta") highTensionCount += 1;
    if (f.amplitude.level === "estreita") narrowAmplitudeCount += 1;
  }

  const narrative = buildNarrative(peopleCount, primaryDimensionDistribution, highTensionCount, avgAdapted, avgNatural);

  return { peopleCount, avgPercentile: { adapted: avgAdapted, natural: avgNatural }, primaryDimensionDistribution, patternDistribution, highTensionCount, narrowAmplitudeCount, narrative };
}

function averageVector(vectors: readonly PercentileVector[]): PercentileVector {
  const out = { D: 0, I: 0, S: 0, C: 0 };
  if (vectors.length === 0) return out;
  for (const v of vectors) for (const d of DIMENSIONS) out[d] += v[d];
  for (const d of DIMENSIONS) out[d] = Math.round(out[d] / vectors.length);
  return out;
}

function buildNarrative(
  n: number,
  primaryDist: Record<Dimension, number>,
  highTension: number,
  avgAdapted: PercentileVector,
  avgNatural: PercentileVector,
): string[] {
  if (n === 0) return ["Nenhum perfil disponível para compor este agregado."];

  const dominant = DIMENSIONS.reduce((best, d) => (primaryDist[d] > primaryDist[best] ? d : best), DIMENSIONS[0]!);
  const dominantShare = Math.round((primaryDist[dominant] / n) * 100);

  const labels: Record<Dimension, string> = { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" };
  const lines: string[] = [];

  lines.push(
    `Time com ${n} pessoas mapeadas. A dimensão primária mais comum é ${labels[dominant]}, presente em ${dominantShare}% do grupo — ` +
      (dominantShare >= 50
        ? "concentração alta o suficiente para valer atenção: um time muito homogêneo tende a ter ponto cego coletivo na dimensão oposta."
        : "sem concentração dominante clara; a composição do time é relativamente heterogênea em estilo comportamental."),
  );

  const gapDims = DIMENSIONS.filter((d) => primaryDist[d] === 0);
  if (gapDims.length > 0) {
    lines.push(`Nenhuma pessoa do grupo tem ${gapDims.map((d) => labels[d]).join(" ou ")} como dimensão primária — vale considerar esse ponto cego ao formar dupla ou distribuir responsabilidade.`);
  }

  if (highTension > 0) {
    const share = Math.round((highTension / n) * 100);
    lines.push(`${highTension} de ${n} pessoas (${share}%) mostram tensão alta entre o comportamento no trabalho e o padrão natural — candidatas prioritárias para uma conversa 1:1 sobre carga e adequação de função.`);
  }

  lines.push(
    `Médias do time — adaptado: D ${avgAdapted.D} · I ${avgAdapted.I} · S ${avgAdapted.S} · C ${avgAdapted.C}. ` +
      `Natural: D ${avgNatural.D} · I ${avgNatural.I} · S ${avgNatural.S} · C ${avgNatural.C}.`,
  );

  return lines;
}
