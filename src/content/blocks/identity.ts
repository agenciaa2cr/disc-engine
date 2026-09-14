import type { ContentBlock } from "../../types.js";
import { always, eqStr } from "../helpers.js";

export const identityBlocks: ContentBlock[] = [
  {
    id: "identity_intro",
    layer: "identity",
    priority: 100,
    condition: always,
    variants: [
      "Seu padrão predominante combina {{dim:pattern.primary}} com {{dim:pattern.secondary}} — chamamos essa combinação de {{pattern.label}}. As páginas a seguir detalham o que isso significa na prática: como você tende a se comunicar, decidir e reagir sob pressão, e onde esse padrão se ajusta (ou não) ao que o dia a dia de trabalho pede.",
      "O traço mais forte do seu perfil é {{dim:pattern.primary}}, seguido de {{dim:pattern.secondary}} — a combinação que classificamos como {{pattern.label}}. O restante deste laudo detalha essa combinação em contextos concretos: comunicação, decisão, liderança e comportamento sob pressão.",
    ],
  },

  // --- 12 combinações ordenadas + perfil equilibrado --------------------
  {
    id: "identity_pattern_DI",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_D_I"),
    variants: [
      "Na prática, isso costuma aparecer como alguém que decide rápido e comunica a decisão com igual rapidez — mobiliza gente em torno de um objetivo em vez de apenas determinar o objetivo. O risco típico dessa combinação é otimismo em excesso na estimativa de prazo e resistência a desacelerar para ouvir objeção.",
    ],
  },
  {
    id: "identity_pattern_DS",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_D_S"),
    variants: [
      "Uma combinação menos comum: o impulso para decidir e agir (D) convivendo com preferência por previsibilidade e constância (S). Na prática costuma render alguém que decide rápido mas prefere implementar aos poucos, com a equipe entendendo o passo seguinte antes de dar o próximo.",
    ],
  },
  {
    id: "identity_pattern_DC",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_D_C"),
    variants: [
      "Decide rápido, mas quer os dados antes de decidir — a combinação de D e C tende a produzir alguém exigente tanto com o resultado quanto com o rigor do caminho até ele. Sob prazo apertado, o risco é a tensão entre \"decidir agora\" e \"verificar mais uma vez\".",
    ],
  },
  {
    id: "identity_pattern_ID",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_I_D"),
    variants: [
      "Comunicação e persuasão vêm primeiro, com uma dose de assertividade logo atrás — alguém que constrói adesão pela conversa, mas não hesita em assumir a posição de quem decide quando é preciso. Tende a preferir influenciar a mandar.",
    ],
  },
  {
    id: "identity_pattern_IS",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_I_S"),
    variants: [
      "Sociável e constante ao mesmo tempo: gosta de gente e investe na relação no longo prazo, não só no primeiro contato. Costuma ser a pessoa que mantém o clima do time, mais do que quem empurra o ritmo.",
    ],
  },
  {
    id: "identity_pattern_IC",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_I_C"),
    variants: [
      "Combinação incomum e valiosa em funções técnicas de cara para o cliente: comunica bem e ainda assim se importa com precisão. Costuma ser quem explica um assunto complexo sem simplificar demais nem perder rigor.",
    ],
  },
  {
    id: "identity_pattern_SD",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_S_D"),
    variants: [
      "Estabilidade como base, com uma camada de firmeza quando necessário — prefere previsibilidade, mas não se furta a tomar posição quando a situação exige. Tende a decidir mais devagar que um perfil D puro, e com mais peso na opinião alheia.",
    ],
  },
  {
    id: "identity_pattern_SI",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_S_I"),
    variants: [
      "Constante e comunicativo: a estabilidade dá o ritmo, a influência dá o tom. Costuma ser a pessoa confiável que também é fácil de ter por perto — bom para papéis que exigem manter relação de longo prazo com cliente ou equipe.",
    ],
  },
  {
    id: "identity_pattern_SC",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_S_C"),
    variants: [
      "Estabilidade e método juntos tendem a produzir alguém que executa processo com consistência alta e poucas surpresas — o perfil que faz a operação funcionar sem drama. A troca costuma ser menor apetite para mudança rápida de direção.",
    ],
  },
  {
    id: "identity_pattern_CD",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_C_D"),
    variants: [
      "Rigor técnico com uma camada de assertividade: questiona, verifica, e quando chega a uma conclusão defende a posição com firmeza. Tende a ser mais crítico com decisão apressada do que a média.",
    ],
  },
  {
    id: "identity_pattern_CI",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_C_I"),
    variants: [
      "Precisão com jeito para comunicar — a combinação típica de quem consegue traduzir um assunto técnico para quem não é da área sem perder exatidão. Prefere ter a resposta certa a ter a resposta rápida.",
    ],
  },
  {
    id: "identity_pattern_CS",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_C_S"),
    variants: [
      "Método e constância reforçando um ao outro: tende a manter um processo estável, documentado e replicável, com pouco apetite por improviso. Combinação comum em funções de controle, qualidade e conformidade.",
    ],
  },
  {
    id: "identity_pattern_equilibrado",
    layer: "identity",
    priority: 90,
    condition: eqStr("pattern.patternId", "pattern_equilibrado"),
    variants: [
      "Seu perfil não tem uma dimensão claramente dominante sobre as outras — as quatro ficam relativamente próximas. Isso costuma indicar repertório comportamental amplo: a pessoa ajusta o estilo com mais facilidade conforme a situação, em vez de aplicar sempre o mesmo padrão. A leitura por dimensão isolada, a seguir, tende a ser mais informativa aqui do que o rótulo de padrão único.",
    ],
  },
];
