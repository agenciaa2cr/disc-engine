import type { TetradBlock } from "../types.js";

/**
 * Banco de itens do DISC 2.0 — 24 blocos tetrádicos (96 afirmações).
 *
 * Cada bloco tem uma afirmação por dimensão, escolhidas para ficarem
 * emparelhadas em registro e desejabilidade social — o problema clássico
 * do formato de escolha forçada é quando um item do bloco é obviamente
 * "melhor" que os outros três, contaminando a escolha com viés de imagem
 * em vez de medir a dimensão. Nenhum par aqui é perfeito; o tratamento
 * definitivo é análise item a item sobre uma amostra real (ver nota de
 * validade no README) antes de finalizar a norma.
 *
 * O MESMO banco é administrado duas vezes (ver src/instrument/session.ts):
 * uma vez com a instrução "no trabalho" (gera o Gráfico I — adaptado) e
 * uma vez com a instrução "no seu jeito mais natural" (Gráfico II —
 * natural). A ordem dos blocos é embaralhada de forma independente em
 * cada passada para reduzir o efeito de memória entre as duas.
 */
export const TETRAD_BLOCKS: readonly TetradBlock[] = [
  { id: "b01", statements: { D: "Decisivo", I: "Entusiasmado", S: "Paciente", C: "Preciso" } },
  { id: "b02", statements: { D: "Direto", I: "Comunicativo", S: "Constante", C: "Analítico" } },
  { id: "b03", statements: { D: "Competitivo", I: "Persuasivo", S: "Leal", C: "Criterioso" } },
  { id: "b04", statements: { D: "Assertivo", I: "Sociável", S: "Calmo", C: "Cauteloso" } },
  { id: "b05", statements: { D: "Ousado", I: "Otimista", S: "Previsível", C: "Metódico" } },
  { id: "b06", statements: { D: "Exigente", I: "Expressivo", S: "Cooperativo", C: "Organizado" } },
  { id: "b07", statements: { D: "Determinado", I: "Espontâneo", S: "Ponderado", C: "Cuidadoso" } },
  { id: "b08", statements: { D: "Autônomo", I: "Carismático", S: "Confiável", C: "Sistemático" } },
  { id: "b09", statements: { D: "Enérgico", I: "Inspirador", S: "Bom ouvinte", C: "Rigoroso" } },
  { id: "b10", statements: { D: "Confrontador", I: "Extrovertido", S: "Estável", C: "Detalhista" } },
  { id: "b11", statements: { D: "Objetivo", I: "Caloroso", S: "Prestativo", C: "Lógico" } },
  { id: "b12", statements: { D: "Ambicioso", I: "Falante", S: "Sereno", C: "Prudente" } },
  { id: "b13", statements: { D: "Impaciente", I: "Envolvente", S: "Consistente", C: "Disciplinado" } },
  { id: "b14", statements: { D: "Independente", I: "Animado", S: "Discreto", C: "Reservado" } },
  { id: "b15", statements: { D: "Desafiador", I: "Confiante em público", S: "Conciliador", C: "Investigativo" } },
  { id: "b16", statements: { D: "Firme", I: "Criativo ao se expressar", S: "Persistente", C: "Ponderado com evidências" } },
  { id: "b17", statements: { D: "Pragmático", I: "Motivador", S: "Tranquilo", C: "Exato" } },
  { id: "b18", statements: { D: "Resoluto", I: "Acolhedor", S: "Dedicado", C: "Formal" } },
  { id: "b19", statements: { D: "Audacioso", I: "Espirituoso", S: "Atencioso", C: "Perfeccionista" } },
  { id: "b20", statements: { D: "Incisivo", I: "Articulado", S: "Comedido", C: "Estruturado" } },
  { id: "b21", statements: { D: "Controlador", I: "Contagiante", S: "Gentil", C: "Questionador" } },
  { id: "b22", statements: { D: "Corajoso", I: "Gosta de gente", S: "Harmonizador", C: "Segue regras com rigor" } },
  { id: "b23", statements: { D: "Rápido para decidir", I: "Improvisador", S: "Constante no ritmo", C: "Verifica antes de agir" } },
  { id: "b24", statements: { D: "Voltado a resultados", I: "Charmoso", S: "Resistente a mudanças bruscas", C: "Reflexivo" } },
];

export const TETRAD_BLOCK_COUNT = TETRAD_BLOCKS.length;
export const ITEMS_PER_PASS = TETRAD_BLOCK_COUNT * 4;
export const TOTAL_ITEMS = ITEMS_PER_PASS * 2;
