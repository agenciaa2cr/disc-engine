import { evaluateCondition } from "./evaluator.js";
import { interpolate } from "./interpolate.js";
import { AUDIENCE_LAYERS, CONTENT_LIBRARY, LAYER_ORDER } from "./library.js";
import { deterministicIndex } from "../util/hash.js";
import type { Audience, ComposedSection, ContentBlock, ContentLayer, ProfileFacts } from "../types.js";

interface IndexedBlock {
  block: ContentBlock;
  libIndex: number;
}

/**
 * Composição de uma camada: avalia condição, resolve conflito de
 * deduplicação por prioridade, ordena o resultado pela ordem autoral da
 * biblioteca (não pela prioridade — prioridade decide só quem vence um
 * empate de dedupeTag, não a ordem de leitura) e escolhe a variante de
 * cada bloco de forma determinística por sessão.
 */
function composeLayer(layer: ContentLayer, audience: Audience, facts: ProfileFacts, sessionId: string): string[] {
  const indexed: IndexedBlock[] = CONTENT_LIBRARY.map((block, libIndex) => ({ block, libIndex })).filter(
    ({ block }) => block.layer === layer,
  );

  const eligible = indexed.filter(({ block }) => {
    if (block.audiences && !block.audiences.includes(audience)) return false;
    return evaluateCondition(block.condition, facts);
  });

  // resolve deduplicação: maior prioridade vence: dedupeTags compartilhadas
  // fazem o bloco de prioridade menor ser descartado.
  const byPriorityDesc = eligible.slice().sort((a, b) => b.block.priority - a.block.priority || a.libIndex - b.libIndex);
  const usedTags = new Set<string>();
  const kept: IndexedBlock[] = [];
  for (const entry of byPriorityDesc) {
    const tags = entry.block.dedupeTags ?? [];
    const collides = tags.some((t) => usedTags.has(t));
    if (collides) continue;
    kept.push(entry);
    for (const t of tags) usedTags.add(t);
  }

  const orderedForReading = kept.slice().sort((a, b) => a.libIndex - b.libIndex);

  return orderedForReading.map(({ block }) => {
    const variantIndex = deterministicIndex(`${sessionId}:${block.id}`, block.variants.length);
    const raw = block.variants[variantIndex] ?? block.variants[0] ?? "";
    return interpolate(raw, facts);
  });
}

export function composeSections(audience: Audience, facts: ProfileFacts, sessionId: string): ComposedSection[] {
  const layers = AUDIENCE_LAYERS[audience];
  const sections: ComposedSection[] = [];
  for (const layer of LAYER_ORDER) {
    if (!layers.includes(layer)) continue;
    const paragraphs = composeLayer(layer, audience, facts, sessionId);
    if (paragraphs.length > 0) sections.push({ layer, paragraphs });
  }
  return sections;
}
