import type { ContentBlock } from "../../types.js";
import { and, eqStr } from "../helpers.js";

/**
 * Camada 5 — comportamento sob pressão, pela dimensão primária (Gráfico
 * II). Cada dimensão tem um bloco base e um bloco "amplificado" que só
 * dispara quando a tensão geral (camada 4) também está alta — os dois
 * compartilham dedupeTag, então o amplificado (prioridade maior) substitui
 * o base em vez de os dois aparecerem juntos e se repetirem.
 */
export const stressBlocks: ContentBlock[] = [
  {
    id: "stress_D_base",
    layer: "stress",
    priority: 1,
    dedupeTags: ["stress_D"],
    condition: eqStr("pattern.primary", "D"),
    variants: [
      "Sob pressão, o padrão dominante em D tende a acelerar decisão e reduzir tolerância a processo — o risco não é paralisar, é decidir rápido demais e pular uma checagem que evitaria erro.",
    ],
  },
  {
    id: "stress_D_alta_tensao",
    layer: "stress",
    priority: 2,
    dedupeTags: ["stress_D"],
    condition: and(eqStr("pattern.primary", "D"), eqStr("delta.level", "alta")),
    variants: [
      "Sob pressão, e já demonstrando tensão alta entre trabalho e padrão natural, o risco em D se acentua: tendência a decisão mais unilateral que o comum, com menos espaço para input alheio do que a situação provavelmente pede. Vale ter um segundo ponto de checagem combinado com antecedência para momentos assim.",
    ],
  },
  {
    id: "stress_I_base",
    layer: "stress",
    priority: 1,
    dedupeTags: ["stress_I"],
    condition: eqStr("pattern.primary", "I"),
    variants: [
      "Sob pressão, o padrão dominante em I tende a buscar apoio social e verbalizar a preocupação em vez de processar sozinho — pode soar como dispersão, mas costuma ser a forma como a pessoa organiza o pensamento.",
    ],
  },
  {
    id: "stress_I_alta_tensao",
    layer: "stress",
    priority: 2,
    dedupeTags: ["stress_I"],
    condition: and(eqStr("pattern.primary", "I"), eqStr("delta.level", "alta")),
    variants: [
      "Sob pressão, e já demonstrando tensão alta entre trabalho e padrão natural, o otimismo característico de I tende a virar promessa otimista demais sobre prazo ou resultado — vale checar compromisso assumido sob estresse com mais cuidado que o normal.",
    ],
  },
  {
    id: "stress_S_base",
    layer: "stress",
    priority: 1,
    dedupeTags: ["stress_S"],
    condition: eqStr("pattern.primary", "S"),
    variants: [
      "Sob pressão, o padrão dominante em S tende a internalizar o desconforto em vez de verbalizá-lo — o sinal de alerta costuma ser silêncio ou recuo, não reclamação explícita. Vale perguntar diretamente em vez de esperar que a pessoa avise sozinha.",
    ],
  },
  {
    id: "stress_S_alta_tensao",
    layer: "stress",
    priority: 2,
    dedupeTags: ["stress_S"],
    condition: and(eqStr("pattern.primary", "S"), eqStr("delta.level", "alta")),
    variants: [
      "Sob pressão, e já demonstrando tensão alta entre trabalho e padrão natural, o risco em S é desgaste silencioso acumulado — vale um check-in direto e recorrente, porque a probabilidade de a pessoa sinalizar sozinha que chegou ao limite é baixa.",
    ],
  },
  {
    id: "stress_C_base",
    layer: "stress",
    priority: 1,
    dedupeTags: ["stress_C"],
    condition: eqStr("pattern.primary", "C"),
    variants: [
      "Sob pressão, o padrão dominante em C tende a intensificar a checagem em vez de reduzir — o risco é atrasar a entrega buscando um nível de certeza que o prazo disponível não comporta.",
    ],
  },
  {
    id: "stress_C_alta_tensao",
    layer: "stress",
    priority: 2,
    dedupeTags: ["stress_C"],
    condition: and(eqStr("pattern.primary", "C"), eqStr("delta.level", "alta")),
    variants: [
      "Sob pressão, e já demonstrando tensão alta entre trabalho e padrão natural, o perfeccionismo característico de C tende a se acentuar — vale definir com antecedência qual nível de acabamento é \"bom o suficiente\" para o prazo em questão, antes de a pressão chegar.",
    ],
  },
];
