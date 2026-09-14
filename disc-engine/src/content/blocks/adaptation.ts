import type { ContentBlock } from "../../types.js";
import { always, eqStr, gte, lte } from "../helpers.js";

const TENSION_THRESHOLD = 15; // delta em percentil, por dimensão, para considerar "adaptação relevante"

/**
 * Camada 4 — adaptação e tensão: a diferença entre o Gráfico I (adaptado,
 * como a pessoa age no trabalho) e o Gráfico II (natural, como ela tende a
 * ser por conta própria). É o dado mais acionável do instrumento e o mais
 * fácil de esconder atrás de um único gráfico — por isso é camada própria.
 */
export const adaptationBlocks: ContentBlock[] = [
  {
    id: "adapt_overall_alta",
    layer: "adaptation",
    priority: 3,
    condition: eqStr("delta.level", "alta"),
    variants: [
      "O conjunto das quatro dimensões mostra tensão alta entre como você age no trabalho e o seu padrão natural — no geral, você está investindo esforço de ajuste acima do comum para atender ao que o ambiente atual espera. Isso não é necessariamente ruim no curto prazo, mas sustentado por muito tempo tende a custar energia.",
    ],
  },
  {
    id: "adapt_overall_baixa",
    layer: "adaptation",
    priority: 1,
    condition: eqStr("delta.level", "baixa"),
    variants: [
      "O conjunto das quatro dimensões mostra tensão baixa entre o Gráfico I e o Gráfico II — no geral, o jeito como você age no trabalho está próximo do seu padrão natural. Costuma ser um bom sinal de aderência entre pessoa e função, ao menos nesta dimensão do trabalho.",
    ],
  },

  // --- por dimensão, nas duas direções -------------------------------------
  {
    id: "adapt_D_up",
    layer: "adaptation",
    priority: 2,
    condition: gte("delta.signedByDim.D", TENSION_THRESHOLD),
    variants: [
      "Em Dominância, você demonstra mais assertividade no trabalho do que no seu padrão natural — provável sinal de que o cargo ou o momento atual está exigindo mais protagonismo em decisão do que seria seu instinto default.",
    ],
  },
  {
    id: "adapt_D_down",
    layer: "adaptation",
    priority: 2,
    condition: lte("delta.signedByDim.D", -TENSION_THRESHOLD),
    variants: [
      "Em Dominância, você demonstra menos assertividade no trabalho do que no seu padrão natural — pode indicar que está conscientemente segurando o impulso de decidir ou de confrontar, possivelmente por hierarquia, cultura da equipe ou fase do cargo.",
    ],
  },
  {
    id: "adapt_I_up",
    layer: "adaptation",
    priority: 2,
    condition: gte("delta.signedByDim.I", TENSION_THRESHOLD),
    variants: [
      "Em Influência, você se mostra mais comunicativo e expressivo no trabalho do que no seu padrão natural — o cargo provavelmente exige mais exposição social do que seria seu default fora dele.",
    ],
  },
  {
    id: "adapt_I_down",
    layer: "adaptation",
    priority: 2,
    condition: lte("delta.signedByDim.I", -TENSION_THRESHOLD),
    variants: [
      "Em Influência, você se mostra mais contido no trabalho do que no seu padrão natural — pode ser ajuste consciente a um ambiente mais formal, ou sinal de que está reservando energia social para fora do expediente.",
    ],
  },
  {
    id: "adapt_S_up",
    layer: "adaptation",
    priority: 2,
    condition: gte("delta.signedByDim.S", TENSION_THRESHOLD),
    variants: [
      "Em Estabilidade, você se mostra mais paciente e constante no trabalho do que no seu padrão natural — sugere disciplina deliberada para manter ritmo estável mesmo quando seu instinto pediria mudar de direção mais rápido.",
    ],
  },
  {
    id: "adapt_S_down",
    layer: "adaptation",
    priority: 2,
    condition: lte("delta.signedByDim.S", -TENSION_THRESHOLD),
    variants: [
      "Em Estabilidade, você se mostra menos paciente com rotina no trabalho do que no seu padrão natural — pode indicar um ambiente que muda de prioridade mais rápido do que você preferiria por conta própria.",
    ],
  },
  {
    id: "adapt_C_up",
    layer: "adaptation",
    priority: 2,
    condition: gte("delta.signedByDim.C", TENSION_THRESHOLD),
    variants: [
      "Em Conformidade, você se mostra mais criterioso e detalhista no trabalho do que no seu padrão natural — sinal comum de cargo que exige mais rigor formal do que seria seu instinto default, e que provavelmente pede esforço extra de atenção sustentada.",
    ],
  },
  {
    id: "adapt_C_down",
    layer: "adaptation",
    priority: 2,
    condition: lte("delta.signedByDim.C", -TENSION_THRESHOLD),
    variants: [
      "Em Conformidade, você se mostra menos apegado a processo no trabalho do que no seu padrão natural — pode ser adaptação a um ambiente que recompensa mais velocidade do que checagem, mesmo quando seu instinto pediria mais verificação.",
    ],
  },

  // --- casos combinados: dimensão de maior delta como abertura da seção ---
  {
    id: "adapt_maxdim_note",
    layer: "adaptation",
    priority: 4,
    condition: always,
    variants: [
      "A dimensão com maior diferença entre os dois gráficos é {{dim:delta.maxDim}} — é o primeiro lugar para olhar se você sente que está gastando mais energia no trabalho do que gostaria.",
    ],
  },
];
