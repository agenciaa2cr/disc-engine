import type { ContentBlock } from "../../types.js";
import { and, gte, lt, THRESH } from "../helpers.js";

/**
 * Camada 2 — leitura dimensão a dimensão, no Gráfico II (natural).
 * Três faixas por dimensão: alta (≥65), moderada (35–64) e baixa (<35).
 * dedupeTags garante que só uma faixa apareça por dimensão mesmo que os
 * limiares venham a ser ajustados para faixas sobrepostas no futuro.
 */
export const dimensionBlocks: ContentBlock[] = [
  // --- D · Dominância -----------------------------------------------------
  {
    id: "dim_D_alta",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_D"],
    condition: gte("percentile.natural.D", THRESH.alta),
    variants: [
      "Dominância alta: tende a decidir rápido e não se incomoda em assumir o desconforto de uma posição impopular quando julga necessário. Rende mais em ambiente com autonomia real e um desafio concreto para resolver; processo lento ou controle excessivo tende a gerar impaciência visível.",
    ],
  },
  {
    id: "dim_D_moderada",
    layer: "dimension",
    priority: 2,
    dedupeTags: ["dim_D"],
    condition: and(gte("percentile.natural.D", THRESH.baixa), lt("percentile.natural.D", THRESH.alta)),
    variants: [
      "Dominância moderada: assume o comando quando a situação pede, mas não precisa estar sempre à frente da decisão. Costuma equilibrar iniciativa própria com espaço para a opinião de quem está ao redor.",
    ],
  },
  {
    id: "dim_D_baixa",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_D"],
    condition: lt("percentile.natural.D", THRESH.baixa),
    variants: [
      "Dominância baixa: prefere que a direção geral venha de outra pessoa e rende melhor executando dentro de um escopo já definido do que definindo o próprio rumo do zero. Meta muito aberta ou ambígua tende a gerar desconforto — funciona melhor com um objetivo claro já dado.",
    ],
  },

  // --- I · Influência -------------------------------------------------------
  {
    id: "dim_I_alta",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_I"],
    condition: gte("percentile.natural.I", THRESH.alta),
    variants: [
      "Influência alta: comunica com facilidade, constrói relação rápido e se energiza em interação social. Ambiente com contato frequente com pessoas tende a render mais do que trabalho solitário e repetitivo, que costuma cansar mais rápido do que para a média.",
    ],
  },
  {
    id: "dim_I_moderada",
    layer: "dimension",
    priority: 2,
    dedupeTags: ["dim_I"],
    condition: and(gte("percentile.natural.I", THRESH.baixa), lt("percentile.natural.I", THRESH.alta)),
    variants: [
      "Influência moderada: comunica bem quando a situação exige, mas não depende de interação constante para manter o ritmo — transita razoavelmente entre trabalho social e trabalho mais solitário.",
    ],
  },
  {
    id: "dim_I_baixa",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_I"],
    condition: lt("percentile.natural.I", THRESH.baixa),
    variants: [
      "Influência baixa: prefere comunicação objetiva e direta a investir tempo construindo rapport extenso antes de ir ao ponto. Tende a render bem em trabalho mais analítico ou solitário; papel que exige networking constante tende a desgastar mais do que para a média.",
    ],
  },

  // --- S · Estabilidade -------------------------------------------------------
  {
    id: "dim_S_alta",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_S"],
    condition: gte("percentile.natural.S", THRESH.alta),
    variants: [
      "Estabilidade alta: prefere rotina previsível e mantém o mesmo padrão de comportamento ao longo do tempo, mesmo sob alguma pressão. Rende mais com processo claro e ritmo estável; mudança de prioridade com frequência alta tende a gerar desgaste visível.",
    ],
  },
  {
    id: "dim_S_moderada",
    layer: "dimension",
    priority: 2,
    dedupeTags: ["dim_S"],
    condition: and(gte("percentile.natural.S", THRESH.baixa), lt("percentile.natural.S", THRESH.alta)),
    variants: [
      "Estabilidade moderada: se adapta a mudança de direção sem grande resistência, mas ainda assim valoriza algum grau de previsibilidade no dia a dia.",
    ],
  },
  {
    id: "dim_S_baixa",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_S"],
    condition: lt("percentile.natural.S", THRESH.baixa),
    variants: [
      "Estabilidade baixa: se adapta rápido a mudança de direção e não se prende a rotina fixa — tolera bem reorganização frequente de prioridade. Trabalho muito repetitivo, sem variação, tende a entediar mais rápido do que para a média.",
    ],
  },

  // --- C · Conformidade -------------------------------------------------------
  {
    id: "dim_C_alta",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_C"],
    condition: gte("percentile.natural.C", THRESH.alta),
    variants: [
      "Conformidade alta: valoriza precisão, verifica antes de entregar e prefere seguir um processo definido a improvisar. Rende mais com critério de qualidade explícito e tempo reservado para checagem; pressão para entregar sem revisão tende a gerar desconforto real.",
    ],
  },
  {
    id: "dim_C_moderada",
    layer: "dimension",
    priority: 2,
    dedupeTags: ["dim_C"],
    condition: and(gte("percentile.natural.C", THRESH.baixa), lt("percentile.natural.C", THRESH.alta)),
    variants: [
      "Conformidade moderada: segue processo quando ele existe e faz sentido, mas não trava na ausência de um — encontra um meio-termo razoável entre seguir a regra e resolver do jeito que funciona.",
    ],
  },
  {
    id: "dim_C_baixa",
    layer: "dimension",
    priority: 3,
    dedupeTags: ["dim_C"],
    condition: lt("percentile.natural.C", THRESH.baixa),
    variants: [
      "Conformidade baixa: prefere agir rápido a investir tempo extenso em verificação, e tolera ambiguidade de processo melhor do que a média. Papel com exigência alta de detalhamento e documentação tende a frustrar mais rápido do que para a média.",
    ],
  },
];
