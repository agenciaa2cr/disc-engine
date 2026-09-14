import { DIMENSIONS } from "../types.js";
import type { Dimension, ScoreVector, TetradResponse } from "../types.js";

/**
 * Escoragem ipsativa bruta de uma passada.
 *
 * Cada bloco contribui +1 para a dimensão escolhida como "mais" e −1 para a
 * escolhida como "menos"; as outras duas dimensões do bloco não recebem
 * nada. Por construção, a soma das quatro dimensões é sempre zero — é a
 * marca registrada de um instrumento ipsativo, e é exatamente por isso que
 * o escore bruto não pode ser lido como "10 pontos de D": ele só faz
 * sentido depois de convertido em percentil contra uma norma (ver norms.ts).
 */
export function scoreRawPass(responses: readonly TetradResponse[]): ScoreVector {
  const score: ScoreVector = { D: 0, I: 0, S: 0, C: 0 };
  for (const r of responses) {
    if (r.most === r.least) {
      throw new Error(`bloco ${r.blockId}: "mais" e "menos" não podem ser a mesma dimensão`);
    }
    score[r.most] += 1;
    score[r.least] -= 1;
  }
  return score;
}

/** Confere que a soma ipsativa é zero (invariante estrutural, útil em testes e no pipeline de ingestão). */
export function isIpsativelyBalanced(score: ScoreVector): boolean {
  const sum = DIMENSIONS.reduce((acc, d) => acc + score[d], 0);
  return sum === 0;
}

export function maxDimension(score: ScoreVector): Dimension {
  return DIMENSIONS.reduce((best, d) => (score[d] > score[best] ? d : best), DIMENSIONS[0]!);
}

export function minDimension(score: ScoreVector): Dimension {
  return DIMENSIONS.reduce((worst, d) => (score[d] < score[worst] ? d : worst), DIMENSIONS[0]!);
}
