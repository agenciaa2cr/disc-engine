import type { ContentBlock } from "../../types.js";
import { eqStr, gte, lt } from "../helpers.js";

/**
 * Camada 7 — aderência à vaga. Os números (overall, gaps por dimensão) já
 * vêm calculados em facts.jobFit por src/jobfit/fit.ts; estes blocos só
 * traduzem o resultado em texto, e só disparam quando uma vaga-alvo foi de
 * fato informada na sessão (jobFit.band só existe quando facts.jobFit
 * existe, então a condição por faixa já implica a presença do cálculo).
 */
export const jobfitBlocks: ContentBlock[] = [
  {
    id: "jobfit_band_alta",
    layer: "jobfit",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: eqStr("jobFit.band", "alta"),
    variants: [
      "Aderência alta ao perfil-alvo da vaga ({{jobFit.overall}}/100). As dimensões do candidato estão próximas do que foi definido como ideal para a posição — use o roteiro de entrevista a seguir para confirmar em conversa o que o número sugere, não para substituí-la.",
    ],
  },
  {
    id: "jobfit_band_moderada",
    layer: "jobfit",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: eqStr("jobFit.band", "moderada"),
    variants: [
      "Aderência moderada ao perfil-alvo da vaga ({{jobFit.overall}}/100). Há pelo menos uma dimensão com distância relevante em relação ao perfil ideal definido para a posição — vale explorar especificamente essa lacuna na entrevista antes de decidir.",
    ],
  },
  {
    id: "jobfit_band_baixa",
    layer: "jobfit",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: eqStr("jobFit.band", "baixa"),
    variants: [
      "Aderência baixa ao perfil-alvo da vaga ({{jobFit.overall}}/100). O perfil comportamental está distante do que foi definido como ideal para a posição em mais de uma dimensão. Isto é um sinal para investigar, não um critério de corte automático — este sistema não elimina candidato por escore de aderência; a decisão continua sendo humana.",
    ],
  },
  {
    id: "jobfit_gap_D",
    layer: "jobfit",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: gte("jobFit.gaps.D", 20),
    variants: ["Em Dominância, o candidato está bem acima do perfil-alvo — vale checar em entrevista como essa assertividade se comportaria dentro da autonomia real que o cargo oferece."],
  },
  {
    id: "jobfit_gap_D_neg",
    layer: "jobfit",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: lt("jobFit.gaps.D", -20),
    variants: ["Em Dominância, o candidato está bem abaixo do perfil-alvo — vale checar em entrevista como ele reage quando precisa decidir sozinho e sob pressão, sem esperar direcionamento."],
  },
  {
    id: "jobfit_gap_C",
    layer: "jobfit",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: gte("jobFit.gaps.C", 20),
    variants: ["Em Conformidade, o candidato está bem acima do perfil-alvo — vale checar em entrevista como ele lida com prazo apertado que não permite o nível de checagem que prefere."],
  },
  {
    id: "jobfit_gap_C_neg",
    layer: "jobfit",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: lt("jobFit.gaps.C", -20),
    variants: ["Em Conformidade, o candidato está bem abaixo do perfil-alvo — vale checar em entrevista um exemplo concreto de como ele garante qualidade quando ninguém está checando o trabalho por ele."],
  },
];
