import type { ContentBlock } from "../../types.js";
import { and, gte, lt, THRESH } from "../helpers.js";

const HI = "percentile.natural";

/**
 * Camada 3 — combinações de duas dimensões, no Gráfico II. É aqui que mora
 * a nuance real do DISC: duas pessoas com o mesmo D alto se comportam de
 * forma bem diferente dependendo do que a segunda dimensão mais forte é.
 * Cobre dez das doze combinações mais informativas — não todas as
 * combinações matematicamente possíveis, que passariam de trinta.
 */
export const pairBlocks: ContentBlock[] = [
  {
    id: "pair_D_hi_C_lo",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.D`, THRESH.alta), lt(`${HI}.C`, THRESH.baixa)),
    variants: [
      "D alto combinado com C baixo tende a produzir decisão rápida com pouca checagem prévia — velocidade alta, risco de pular etapa de verificação que evitaria retrabalho.",
    ],
  },
  {
    id: "pair_D_hi_C_hi",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.D`, THRESH.alta), gte(`${HI}.C`, THRESH.alta)),
    variants: [
      "D alto combinado com C também alto costuma gerar tensão interna produtiva: quer decidir rápido, mas também quer dado antes de decidir. Sob prazo curto, essa combinação pode travar buscando uma certeza que o tempo disponível não permite.",
    ],
  },
  {
    id: "pair_D_hi_S_lo",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.D`, THRESH.alta), lt(`${HI}.S`, THRESH.baixa)),
    variants: [
      "D alto com S baixo tende a se sentir confortável com confronto direto e mudança constante de direção — bom em ambiente que muda rápido, mas pode subestimar o custo da mudança para quem tem menos tolerância a ela.",
    ],
  },
  {
    id: "pair_I_hi_C_hi",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.I`, THRESH.alta), gte(`${HI}.C`, THRESH.alta)),
    variants: [
      "I alto com C também alto é uma combinação menos comum: comunica bem e ainda assim se preocupa com exatidão — costuma ser quem traduz um assunto técnico para quem não é da área sem perder rigor no processo.",
    ],
  },
  {
    id: "pair_I_hi_S_lo",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.I`, THRESH.alta), lt(`${HI}.S`, THRESH.baixa)),
    variants: [
      "I alto com S baixo tende a gostar de gente mas cansar de manutenção de relação no longo prazo — mais forte em construir conexão nova do que em sustentar a mesma relação por muito tempo sem variação.",
    ],
  },
  {
    id: "pair_I_hi_D_lo",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.I`, THRESH.alta), lt(`${HI}.D`, THRESH.baixa)),
    variants: [
      "I alto com D baixo costuma conectar pessoas e gerar entusiasmo em torno de uma ideia, mas evita o embate direto — tende a preferir convencer a impor, mesmo quando teria autoridade para decidir sozinho.",
    ],
  },
  {
    id: "pair_S_hi_D_lo",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.S`, THRESH.alta), lt(`${HI}.D`, THRESH.baixa)),
    variants: [
      "S alto com D baixo tende a preferir estabilidade a confronto — costuma evitar decisão sob crise se puder delegar, e valoriza mais manter a relação intacta do que vencer uma discussão.",
    ],
  },
  {
    id: "pair_S_hi_C_hi",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.S`, THRESH.alta), gte(`${HI}.C`, THRESH.alta)),
    variants: [
      "S alto com C alto costuma produzir processo estável, bem documentado e replicável — forte em manter a operação funcionando sem sobressalto, com menor apetite para mudar de direção rápido mesmo quando os dados pedem.",
    ],
  },
  {
    id: "pair_C_hi_I_lo",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.C`, THRESH.alta), lt(`${HI}.I`, THRESH.baixa)),
    variants: [
      "C alto com I baixo tende a priorizar exatidão sobre construção de relação na comunicação — pode soar mais frio ou seco do que pretende, mesmo quando o conteúdo do que diz está certo.",
    ],
  },
  {
    id: "pair_C_hi_D_lo",
    layer: "pair",
    priority: 1,
    condition: and(gte(`${HI}.C`, THRESH.alta), lt(`${HI}.D`, THRESH.baixa)),
    variants: [
      "C alto com D baixo costuma questionar bastante antes de agir e evitar decisão tomada sob pressão de tempo — forte em não deixar passar erro, mais lento quando a situação exige resposta imediata sem dado completo.",
    ],
  },
];
