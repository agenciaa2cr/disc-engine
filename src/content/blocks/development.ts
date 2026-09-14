import type { ContentBlock } from "../../types.js";
import { eqStr } from "../helpers.js";

/**
 * Camada 9 — plano de desenvolvimento, orientado pela dimensão de
 * percentil mais baixo no Gráfico II (facts.weakest). A lógica: a
 * dimensão menos natural costuma ser a que mais exige energia consciente
 * quando o trabalho a demanda — é onde um PDI direcionado rende mais.
 */
export const developmentBlocks: ContentBlock[] = [
  {
    id: "dev_weakest_D",
    layer: "development",
    priority: 1,
    condition: eqStr("weakest", "D"),
    variants: [
      "Sua dimensão menos natural é Dominância. Se o cargo exigir mais decisão autônoma ou posicionamento direto, vale treinar deliberadamente: comece marcando um prazo para si mesmo antes de decidir algo pequeno, e pratique dar uma opinião direta em reunião mesmo sem ser perguntado.",
    ],
  },
  {
    id: "dev_weakest_I",
    layer: "development",
    priority: 1,
    condition: eqStr("weakest", "I"),
    variants: [
      "Sua dimensão menos natural é Influência. Se o cargo exigir mais exposição ou construção de rede, vale treinar deliberadamente: pratique puxar conversa em uma situação de baixo risco por semana, e busque feedback sobre como sua comunicação chega para quem não te conhece bem.",
    ],
  },
  {
    id: "dev_weakest_S",
    layer: "development",
    priority: 1,
    condition: eqStr("weakest", "S"),
    variants: [
      "Sua dimensão menos natural é Estabilidade. Se o cargo exigir mais consistência de longo prazo, vale treinar deliberadamente: escolha uma rotina pequena e sustente por seis semanas seguidas sem alterar, e observe o que te faz querer mudar de direção antes da hora.",
    ],
  },
  {
    id: "dev_weakest_C",
    layer: "development",
    priority: 1,
    condition: eqStr("weakest", "C"),
    variants: [
      "Sua dimensão menos natural é Conformidade. Se o cargo exigir mais rigor de processo ou checagem, vale treinar deliberadamente: adote uma checklist simples antes de considerar qualquer entrega pronta, e reserve um tempo fixo só para revisão antes de enviar.",
    ],
  },
];
