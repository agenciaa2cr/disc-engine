import type { Audience, ContentBlock, ContentLayer } from "../types.js";
import { identityBlocks } from "./blocks/identity.js";
import { dimensionBlocks } from "./blocks/dimension.js";
import { pairBlocks } from "./blocks/pair.js";
import { adaptationBlocks } from "./blocks/adaptation.js";
import { stressBlocks } from "./blocks/stress.js";
import { contextBlocks } from "./blocks/context.js";
import { jobfitBlocks } from "./blocks/jobfit.js";
import { interviewBlocks } from "./blocks/interview.js";
import { developmentBlocks } from "./blocks/development.js";
import { qualityBlocks } from "./blocks/quality.js";

/**
 * Versão da biblioteca de conteúdo — gravada em todo laudo emitido (ver
 * Report.contentLibraryVersion). Suba este número sempre que o conteúdo
 * mudar; é assim que se reproduz um laudo antigo exatamente como foi
 * emitido, mesmo depois de a biblioteca evoluir.
 *
 * Estado atual: 92 blocos cobrindo as dez camadas, pensado como o núcleo
 * funcional da arquitetura — não o banco final de 320–420 blocos com
 * múltiplas variantes por entrada estimado na proposta para a Fase 1
 * completa. Expandir é questão de acrescentar dados aqui, não de mudar
 * código (ver README, seção "Expandindo a biblioteca").
 */
export const CONTENT_LIBRARY_VERSION = "2.0.0-mvp";

export const CONTENT_LIBRARY: readonly ContentBlock[] = [
  ...identityBlocks,
  ...dimensionBlocks,
  ...pairBlocks,
  ...adaptationBlocks,
  ...stressBlocks,
  ...contextBlocks,
  ...jobfitBlocks,
  ...interviewBlocks,
  ...developmentBlocks,
  ...qualityBlocks,
];

/** Ordem de exibição das camadas no laudo composto. */
export const LAYER_ORDER: readonly ContentLayer[] = [
  "quality",
  "identity",
  "dimension",
  "pair",
  "adaptation",
  "stress",
  "context",
  "jobfit",
  "interview",
  "development",
];

/** Quais camadas cada audiência recebe — ver seção 6 da proposta ("Quatro leitores, quatro versões"). */
export const AUDIENCE_LAYERS: Record<Audience, readonly ContentLayer[]> = {
  candidato: ["quality", "identity", "dimension", "pair", "adaptation", "stress", "context"],
  recrutador: ["quality", "identity", "dimension", "pair", "adaptation", "stress", "context", "jobfit", "interview", "development"],
  gestor: ["quality", "identity", "dimension", "pair", "adaptation", "stress", "context", "development"],
  equipe: [], // relatório de equipe é agregado, não camada a camada — ver src/reports/team.ts
};

export function blocksForLayer(layer: ContentLayer): ContentBlock[] {
  return CONTENT_LIBRARY.filter((b) => b.layer === layer);
}
