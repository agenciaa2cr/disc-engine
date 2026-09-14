import type { ContentBlock } from "../../types.js";
import { eqStr } from "../helpers.js";

const P = "pattern.primary";

/**
 * Camada 6 — contextos aplicados: comunicação, decisão, liderança e
 * conflito, lidos pela dimensão primária (Gráfico II). Quatro contextos ×
 * quatro dimensões = dezesseis blocos, cada um mutuamente exclusivo dentro
 * do seu contexto (a dimensão primária é única por protocolo).
 */
export const contextBlocks: ContentBlock[] = [
  // --- Comunicação ---------------------------------------------------------
  { id: "ctx_comunicacao_D", layer: "context", priority: 1, condition: eqStr(P, "D"),
    variants: ["Comunicação: direta e objetiva, foco no resultado antes do processo. Tende a encurtar a conversa quando sente que já entendeu o ponto — o que pode ser lido como impaciência por quem prefere mais contexto antes de ir ao assunto."] },
  { id: "ctx_comunicacao_I", layer: "context", priority: 1, condition: eqStr(P, "I"),
    variants: ["Comunicação: expressiva e envolvente, usa história e exemplo para prender atenção. Tende a falar mais do que ouvir em momento de entusiasmo — vale checar se o espaço para a réplica do outro lado está de fato aberto."] },
  { id: "ctx_comunicacao_S", layer: "context", priority: 1, condition: eqStr(P, "S"),
    variants: ["Comunicação: calma e ponderada, bom ouvinte, evita interromper. Tende a levar mais tempo para se posicionar publicamente — o silêncio nessa dimensão costuma significar processamento, não concordância automática."] },
  { id: "ctx_comunicacao_C", layer: "context", priority: 1, condition: eqStr(P, "C"),
    variants: ["Comunicação: precisa e bem fundamentada, prefere dado a opinião solta. Tende a ser mais formal do que a média — pode soar distante em contexto que espera calor humano explícito."] },

  // --- Decisão --------------------------------------------------------------
  { id: "ctx_decisao_D", layer: "context", priority: 1, condition: eqStr(P, "D"),
    variants: ["Decisão: rápida, com base no que já sabe, sem esperar informação completa. Boa em cenário de urgência real; arriscada em decisão de alto impacto que se beneficiaria de mais uma rodada de checagem."] },
  { id: "ctx_decisao_I", layer: "context", priority: 1, condition: eqStr(P, "I"),
    variants: ["Decisão: guiada por intuição sobre pessoas e por entusiasmo com a opção mais empolgante. Vale ter um segundo critério mais frio de checagem, porque o otimismo tende a pesar mais do que deveria na balança."] },
  { id: "ctx_decisao_S", layer: "context", priority: 1, condition: eqStr(P, "S"),
    variants: ["Decisão: cautelosa, prefere manter o caminho já conhecido a arriscar uma mudança de rumo sem necessidade clara. Tende a demorar mais que a média em decisão sob pressão de tempo."] },
  { id: "ctx_decisao_C", layer: "context", priority: 1, condition: eqStr(P, "C"),
    variants: ["Decisão: baseada em dado e análise, resiste a decidir com informação incompleta mesmo quando o prazo aperta. Forte em não deixar passar erro; mais lenta que o ideal quando a situação pede resposta imediata."] },

  // --- Liderança ------------------------------------------------------------
  { id: "ctx_lideranca_D", layer: "context", priority: 1, condition: eqStr(P, "D"),
    variants: ["Liderança: direciona com clareza e cobra resultado sem rodeio. Tende a delegar a tarefa mas não sempre a autonomia sobre como fazê-la — vale checar se o time tem espaço real de decisão dentro do que foi delegado."] },
  { id: "ctx_lideranca_I", layer: "context", priority: 1, condition: eqStr(P, "I"),
    variants: ["Liderança: inspira pelo entusiasmo e reconhece publicamente o esforço da equipe. Tende a ser menos rigorosa no acompanhamento de detalhe operacional — vale complementar com um processo estruturado de acompanhamento."] },
  { id: "ctx_lideranca_S", layer: "context", priority: 1, condition: eqStr(P, "S"),
    variants: ["Liderança: constrói confiança pela consistência e disponibilidade; evita microgerenciar. Tende a adiar uma conversa difícil de desempenho mais do que seria ideal — vale um lembrete estruturado para não deixar passar."] },
  { id: "ctx_lideranca_C", layer: "context", priority: 1, condition: eqStr(P, "C"),
    variants: ["Liderança: referência técnica, exige qualidade alta e dá feedback específico e fundamentado. Tende a ter padrão mais alto do que a média da equipe consegue sustentar sem apoio — vale calibrar a régua ao contexto de cada pessoa."] },

  // --- Conflito -------------------------------------------------------------
  { id: "ctx_conflito_D", layer: "context", priority: 1, condition: eqStr(P, "D"),
    variants: ["Conflito: enfrenta direto, prefere resolver na hora a deixar acumular. Pode escalar o tom mais rápido do que pretende — vale um segundo antes de responder quando sente que subiu o volume da conversa."] },
  { id: "ctx_conflito_I", layer: "context", priority: 1, condition: eqStr(P, "I"),
    variants: ["Conflito: tenta suavizar pelo humor ou pela conversa antes de confrontar diretamente. Pode adiar o ponto central da discórdia tentando manter o clima leve — vale nomear o problema com a mesma clareza que nomeia o elogio."] },
  { id: "ctx_conflito_S", layer: "context", priority: 1, condition: eqStr(P, "S"),
    variants: ["Conflito: evita quando possível, cede para preservar a relação. O custo é o ressentimento acumulado por não nomear o desconforto a tempo — vale um espaço estruturado e regular para trazer o que incomoda."] },
  { id: "ctx_conflito_C", layer: "context", priority: 1, condition: eqStr(P, "C"),
    variants: ["Conflito: argumenta com dado e lógica, evita a carga emocional da discussão. Pode ser lido como frio por quem espera reconhecimento do lado emocional do desacordo antes de entrar na argumentação técnica."] },
];
