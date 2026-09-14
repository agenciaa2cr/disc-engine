import { DIMENSIONS, type Dimension, type Pass, type PercentileVector, type ScoreVector } from "../types.js";

/**
 * Conversão de escore bruto em percentil.
 *
 * Sem uma amostra normativa brasileira real ainda coletada, usamos como
 * padrão a distribuição TEÓRICA do escore sob resposta aleatória: para um
 * bloco tetrádico, cada dimensão tem 1/4 de chance de ser escolhida como
 * "mais" (+1), 1/4 de ser "menos" (−1) e 1/2 de não ser escolhida (0), o
 * que dá variância 0,5 por bloco. Com 24 blocos independentes, a variância
 * do escore somado é 24 × 0,5 = 12 (desvio-padrão ≈ 3,46), centrada em 0.
 *
 * Isso é deliberadamente conservador: é a distribuição nula, não uma norma
 * populacional real. Serve para colocar o instrumento em produção com uma
 * escala interpretável desde o primeiro protocolo. NormTable existe
 * exatamente para que essas constantes sejam substituídas por médias e
 * desvios-padrão observados assim que houver amostra suficiente — a meta
 * declarada na proposta é recalibrar a cada 500 protocolos coletados.
 */
export const THEORETICAL_MEAN = 0;
export const THEORETICAL_SD = Math.sqrt(24 * 0.5); // ≈ 3.4641

export interface NormTable {
  version: string;
  sampleSize: number;
  /** média e desvio-padrão por dimensão e por passada */
  params: Record<Pass, Record<Dimension, { mean: number; sd: number }>>;
}

export function theoreticalNormTable(): NormTable {
  const perDim = { mean: THEORETICAL_MEAN, sd: THEORETICAL_SD };
  const perPass = { D: { ...perDim }, I: { ...perDim }, S: { ...perDim }, C: { ...perDim } };
  return {
    version: "teorica-v1",
    sampleSize: 0,
    params: { adapted: { ...perPass }, natural: { ...perPass } },
  };
}

/** Aproximação de Abramowitz & Stegun (7.1.26) para a função erro — erro máx. ≈ 1.5×10⁻⁷. */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(x: number, mean: number, sd: number): number {
  if (sd <= 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / (sd * Math.SQRT2);
  return 0.5 * (1 + erf(z));
}

/** Escore bruto → percentil (1–99), usando a norma informada (ou a teórica, por padrão). */
export function rawToPercentile(raw: number, mean: number, sd: number): number {
  const p = Math.round(normalCdf(raw, mean, sd) * 100);
  return Math.min(99, Math.max(1, p));
}

export function scoreVectorToPercentiles(score: ScoreVector, pass: Pass, norms: NormTable = theoreticalNormTable()): PercentileVector {
  const out = {} as PercentileVector;
  for (const d of DIMENSIONS) {
    const { mean, sd } = norms.params[pass][d];
    out[d] = rawToPercentile(score[d], mean, sd);
  }
  return out;
}
