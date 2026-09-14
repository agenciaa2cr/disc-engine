import { TETRAD_BLOCKS } from "./blocks.js";
import { ANCHOR_ITEMS } from "./anchors.js";
import { fnv1a, seededShuffle } from "../util/hash.js";
import type { Pass, TetradBlock, AnchorItem } from "../types.js";

export const PASS_INSTRUCTIONS: Record<Pass, { title: string; body: string }> = {
  adapted: {
    title: "Como você age no trabalho",
    body:
      "Para cada grupo de quatro palavras, marque a que MAIS combina e a que MENOS combina " +
      "com o seu jeito de agir no ambiente de trabalho — pensando nas expectativas do seu " +
      "cargo, do seu gestor e da sua equipe.",
  },
  natural: {
    title: "Como você é no seu jeito mais natural",
    body:
      "Agora os mesmos grupos, em outra ordem. Marque a que MAIS combina e a que MENOS " +
      "combina com você fora de pressão — como você tende a agir por conta própria, sem " +
      "se ajustar a expectativas externas.",
  },
};

/** Ordem de blocos embaralhada de forma determinística e independente por passada. */
export function orderedBlocksForPass(sessionId: string, pass: Pass): TetradBlock[] {
  const seed = fnv1a(`${sessionId}:${pass}:blocks`);
  return seededShuffle(TETRAD_BLOCKS, seed);
}

export function orderedAnchors(sessionId: string): AnchorItem[] {
  const seed = fnv1a(`${sessionId}:anchors`);
  return seededShuffle(ANCHOR_ITEMS, seed);
}

/** Estrutura de sessão pronta para servir ao cliente (candidato). */
export interface SessionPlan {
  sessionId: string;
  passes: Array<{
    pass: Pass;
    instructions: { title: string; body: string };
    blocks: TetradBlock[];
  }>;
  anchors: AnchorItem[];
  estimatedMinutes: [number, number];
}

export function buildSessionPlan(sessionId: string): SessionPlan {
  return {
    sessionId,
    passes: [
      { pass: "adapted", instructions: PASS_INSTRUCTIONS.adapted, blocks: orderedBlocksForPass(sessionId, "adapted") },
      { pass: "natural", instructions: PASS_INSTRUCTIONS.natural, blocks: orderedBlocksForPass(sessionId, "natural") },
    ],
    anchors: orderedAnchors(sessionId),
    estimatedMinutes: [8, 12],
  };
}
