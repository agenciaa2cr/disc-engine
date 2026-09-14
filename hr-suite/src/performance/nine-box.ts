import type { NineBoxLevel } from "./types.js";

/**
 * Matriz 9-box clássica: desempenho (linha) × potencial (coluna), 1–3 em
 * cada eixo. `boxNumber` é 1–9 lendo a matriz da esquerda para a direita,
 * de baixo para cima — convenção comum o bastante para não precisar
 * reinventar, mas o número em si importa menos que o rótulo: é o rótulo
 * que vai para a tela.
 */
const LABELS: Record<string, string> = {
  "1-1": "Risco",
  "2-1": "Questionável",
  "3-1": "Enigma",
  "1-2": "Mantenedor",
  "2-2": "Mantenedor forte",
  "3-2": "Alto potencial",
  "1-3": "Especialista eficaz",
  "2-3": "Alto desempenho",
  "3-3": "Estrela",
};

export function boxNumber(performanceLevel: NineBoxLevel, potentialLevel: NineBoxLevel): number {
  return (potentialLevel - 1) * 3 + performanceLevel;
}

export function boxLabel(performanceLevel: NineBoxLevel, potentialLevel: NineBoxLevel): string {
  return LABELS[`${performanceLevel}-${potentialLevel}`] ?? "Não classificado";
}
