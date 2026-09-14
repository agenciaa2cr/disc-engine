import type { ContentBlock } from "../../types.js";
import { eqStr } from "../helpers.js";

const P = "pattern.primary";

/**
 * Camada 8 — roteiro de entrevista, indexado pela dimensão primária. Só
 * visível para recrutador e gestor: existe para orientar pergunta
 * comportamental, não para o candidato adivinhar a "resposta certa".
 */
export const interviewBlocks: ContentBlock[] = [
  {
    id: "interview_D",
    layer: "interview",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: eqStr(P, "D"),
    variants: [
      "Perguntas sugeridas — observe se a resposta traz um caso real, com resultado e consequência, ou fica no nível do discurso:\n" +
        "• Conte sobre uma decisão importante que você tomou sozinho, sob prazo curto, sem checar com ninguém. O que aconteceu depois?\n" +
        "• Já teve que voltar atrás de uma decisão? O que te fez perceber que precisava mudar?\n" +
        "• Como você reage quando alguém questiona uma decisão sua na frente de outras pessoas?",
    ],
  },
  {
    id: "interview_I",
    layer: "interview",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: eqStr(P, "I"),
    variants: [
      "Perguntas sugeridas — observe se a resposta traz um caso real, com resultado e consequência, ou fica no nível do discurso:\n" +
        "• Conte sobre um projeto que precisou de acompanhamento detalhado e repetitivo por várias semanas. Como foi manter o ritmo até o fim?\n" +
        "• Já prometeu um prazo mais otimista do que deveria? O que aconteceu e o que mudou depois disso?\n" +
        "• Como você lida quando precisa trabalhar sozinho, sem interação com o time, por um período longo?",
    ],
  },
  {
    id: "interview_S",
    layer: "interview",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: eqStr(P, "S"),
    variants: [
      "Perguntas sugeridas — observe se a resposta traz um caso real, com resultado e consequência, ou fica no nível do discurso:\n" +
        "• Conte sobre uma vez em que precisou se posicionar contra a maioria do grupo. Como foi?\n" +
        "• Já teve que se adaptar a uma mudança de direção repentina que não fazia sentido pra você? Como reagiu?\n" +
        "• Descreva uma situação em que precisou dar um feedback difícil para alguém. O que fez, e o que faria diferente?",
    ],
  },
  {
    id: "interview_C",
    layer: "interview",
    priority: 1,
    audiences: ["recrutador", "gestor"],
    condition: eqStr(P, "C"),
    variants: [
      "Perguntas sugeridas — observe se a resposta traz um caso real, com resultado e consequência, ou fica no nível do discurso:\n" +
        "• Conte sobre uma entrega que precisou sair sem o nível de checagem que você julgava ideal. Como decidiu o que cortar?\n" +
        "• Já discordou de uma decisão tomada sem dado suficiente? O que fez a respeito?\n" +
        "• Descreva uma situação em que teve que confiar no julgamento de outra pessoa em vez de verificar você mesmo.",
    ],
  },
];
