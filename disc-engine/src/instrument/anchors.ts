import type { AnchorItem } from "../types.js";

/**
 * Oito itens-âncora normativos (Likert 1–5, discordo totalmente → concordo
 * totalmente), dois por dimensão. Não entram no escore ipsativo — servem
 * só para o índice de consistência: comparamos se quem pontua alto em D
 * no par ipsativo também concorda mais com as âncoras de D do que com as
 * de outras dimensões. Divergência sistemática é sinal de protocolo a
 * revisar, não de "perfil contraditório".
 */
export const ANCHOR_ITEMS: readonly AnchorItem[] = [
  { id: "a_d1", dimension: "D", text: "Tomo decisões rapidamente, mesmo com informação incompleta." },
  { id: "a_d2", dimension: "D", text: "Prefiro assumir o controle de uma situação a esperar que outra pessoa decida." },
  { id: "a_i1", dimension: "I", text: "Fico à vontade puxando conversa com pessoas que não conheço." },
  { id: "a_i2", dimension: "I", text: "Prefiro resolver um problema conversando com o grupo a analisar sozinho." },
  { id: "a_s1", dimension: "S", text: "Mudanças bruscas de plano me incomodam mais do que à maioria das pessoas." },
  { id: "a_s2", dimension: "S", text: "Prefiro manter uma rotina estável a variar constantemente minha forma de trabalhar." },
  { id: "a_c1", dimension: "C", text: "Reviso um trabalho várias vezes antes de considerá-lo pronto." },
  { id: "a_c2", dimension: "C", text: "Prefiro seguir um processo definido a improvisar uma solução." },
];
