// Gerador de respostas sintéticas — SÓ para demo/teste manual. Não faz
// parte do motor (src/); simula um respondente com uma tendência conhecida
// para validar visualmente que a escoragem e o laudo reagem como esperado.
import { TETRAD_BLOCKS } from "../../src/instrument/blocks.js";
import { ANCHOR_ITEMS } from "../../src/instrument/anchors.js";
import { mulberry32, fnv1a } from "../../src/util/hash.js";
import { DIMENSIONS } from "../../src/types.js";
import type { AnchorResponse, Dimension, SessionResponses, TetradResponse } from "../../src/types.js";

export type Bias = Record<Dimension, number>; // pesos relativos, não precisam somar 1

function weightedPick(rand: () => number, weights: Bias, exclude: Dimension[] = []): Dimension {
  const candidates = DIMENSIONS.filter((d) => !exclude.includes(d));
  const total = candidates.reduce((acc, d) => acc + weights[d], 0);
  let r = rand() * total;
  for (const d of candidates) {
    r -= weights[d];
    if (r <= 0) return d;
  }
  return candidates[candidates.length - 1]!;
}

function generatePass(seed: number, bias: Bias, fastNoiseRatio = 0): TetradResponse[] {
  const rand = mulberry32(seed);
  // complemento monotônico: quanto maior o peso original de uma dimensão,
  // menor sua chance de ser escolhida como "menos" — preserva a ordem
  // relativa das quatro em vez de só distinguir a máxima das demais.
  const totalW = DIMENSIONS.reduce((acc, d) => acc + bias[d], 0);
  const inverseBias: Bias = { D: 0, I: 0, S: 0, C: 0 };
  for (const d of DIMENSIONS) inverseBias[d] = totalW - bias[d] + 0.02;

  return TETRAD_BLOCKS.map((block) => {
    const most = weightedPick(rand, bias);
    const least = weightedPick(rand, inverseBias, [most]);
    const isFast = rand() < fastNoiseRatio;
    const responseMs = isFast ? 400 + Math.floor(rand() * 300) : 1800 + Math.floor(rand() * 2500);
    return { blockId: block.id, most, least, responseMs };
  });
}

function generateAnchors(seed: number, bias: Bias): AnchorResponse[] {
  const rand = mulberry32(seed);
  const maxW = Math.max(...DIMENSIONS.map((d) => bias[d]));
  return ANCHOR_ITEMS.map((item) => {
    const normalized = bias[item.dimension] / maxW; // 0..1
    const noise = (rand() - 0.5) * 1.2;
    const rating = Math.min(5, Math.max(1, Math.round(1 + normalized * 4 + noise))) as AnchorResponse["rating"];
    return { itemId: item.id, rating };
  });
}

export interface SyntheticOptions {
  sessionId: string;
  adaptedBias: Bias;
  naturalBias: Bias;
  fastNoiseRatio?: number;
}

export function generateSyntheticResponses(opts: SyntheticOptions): SessionResponses {
  return {
    adapted: generatePass(fnv1a(`${opts.sessionId}:adapted`), opts.adaptedBias, opts.fastNoiseRatio ?? 0),
    natural: generatePass(fnv1a(`${opts.sessionId}:natural`), opts.naturalBias, opts.fastNoiseRatio ?? 0),
    anchors: generateAnchors(fnv1a(`${opts.sessionId}:anchors`), opts.naturalBias),
  };
}

// Alguns arquétipos usados na demo — não são "os" quatro perfis puros do
// DISC, só vieses convenientes para exercitar o pipeline inteiro.
export const ARCHETYPES: Record<string, Bias> = {
  "D-dominante": { D: 0.55, I: 0.2, S: 0.1, C: 0.15 },
  "I-dominante": { D: 0.15, I: 0.55, S: 0.2, C: 0.1 },
  "S-dominante": { D: 0.1, I: 0.15, S: 0.55, C: 0.2 },
  "C-dominante": { D: 0.15, I: 0.1, S: 0.2, C: 0.55 },
  Equilibrado: { D: 0.26, I: 0.25, S: 0.24, C: 0.25 },
};
