import { PIPELINE_STAGES, TERMINAL_STAGES, type PipelineStage } from "./types.js";

/**
 * Máquina de estados do funil de seleção. Regras:
 *  - avançar só para o próximo estágio da ordem canônica (sem pular etapa);
 *  - "rejected" é alcançável de qualquer estágio não-terminal, a qualquer
 *    momento — uma rejeição não segue a ordem;
 *  - "hired" e "rejected" são terminais: nenhuma transição sai deles sem
 *    passar por reabrirCandidatura, que é uma ação explícita e registrada
 *    separadamente, não uma transição normal de estágio.
 *
 * A validação aqui não é decorativa: é o que impede o pipeline de acabar
 * com um estado inconsistente (ex.: "hired" sem nunca ter passado por
 * entrevista) por um bug de UI que manda o id de estágio errado.
 */
export function canTransition(from: PipelineStage, to: PipelineStage): boolean {
  if (TERMINAL_STAGES.includes(from)) return false;
  if (to === "rejected") return true;
  const fromIdx = PIPELINE_STAGES.indexOf(from);
  const toIdx = PIPELINE_STAGES.indexOf(to);
  return toIdx === fromIdx + 1;
}

export function nextStage(current: PipelineStage): PipelineStage | undefined {
  if (TERMINAL_STAGES.includes(current)) return undefined;
  const idx = PIPELINE_STAGES.indexOf(current);
  return PIPELINE_STAGES[idx + 1];
}

export function isTerminal(stage: PipelineStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}
