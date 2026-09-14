import type { ContentBlock } from "../../types.js";
import { boolIs, includesVal } from "../helpers.js";

/**
 * Camada 10 — qualidade do protocolo. Estes blocos existem para aparecer
 * no laudo, não para ficar escondidos num campo interno: se o protocolo
 * tem um problema de validade, quem lê o laudo precisa saber, com a mesma
 * visibilidade que o resto do conteúdo.
 */
export const qualityBlocks: ContentBlock[] = [
  {
    id: "quality_ok",
    layer: "quality",
    priority: 1,
    condition: boolIs("validity.valid", true),
    variants: [
      "Nenhum alerta de validade foi disparado neste protocolo: tempo de resposta, variabilidade entre blocos e consistência com as âncoras de confirmação estão dentro do esperado.",
    ],
  },
  {
    id: "quality_incompleto",
    layer: "quality",
    priority: 4,
    condition: includesVal("validity.flags", "respostas_incompletas"),
    variants: [
      "Alerta: o protocolo está incompleto — nem todos os blocos das duas passadas foram respondidos. Os escores e o laudo abaixo são calculados só com o que foi respondido e devem ser tratados como provisórios.",
    ],
  },
  {
    id: "quality_flatline",
    layer: "quality",
    priority: 3,
    condition: includesVal("validity.flags", "flatline"),
    variants: [
      "Alerta: padrão de resposta muito repetitivo — uma mesma dimensão foi marcada como \"mais\" na grande maioria dos blocos, o que é estatisticamente incomum em resposta genuína. Considere reaplicar o teste antes de usar este laudo para decisão.",
    ],
  },
  {
    id: "quality_tempo",
    layer: "quality",
    priority: 2,
    condition: includesVal("validity.flags", "tempo_anomalo"),
    variants: [
      "Alerta: proporção relevante dos blocos foi respondida muito rápido para uma leitura genuína das quatro opções. Pode indicar pressa, ou o respondente já conhecendo o instrumento — vale considerar o contexto antes de interpretar o laudo ao pé da letra.",
    ],
  },
  {
    id: "quality_consistencia",
    layer: "quality",
    priority: 2,
    condition: includesVal("validity.flags", "baixa_consistencia"),
    variants: [
      "Alerta: baixa concordância entre as respostas ipsativas (blocos de escolha forçada) e as afirmações de confirmação (escala de 1 a 5). Não invalida o protocolo por si só, mas é um sinal para tratar o laudo com mais cautela do que o normal.",
    ],
  },
  {
    id: "quality_desejabilidade",
    layer: "quality",
    priority: 1,
    condition: includesVal("validity.flags", "desejabilidade_social_alta"),
    variants: [
      "Observação: o padrão de respostas favoreceu de forma notável as afirmações de Influência e Estabilidade sobre as de Dominância e Conformidade — possível efeito de desejabilidade social. Não é, isoladamente, motivo para descartar o protocolo.",
    ],
  },
];
