/**
 * Questionário de riscos psicossociais — estrutura inspirada no COPSOQ III
 * (Copenhagen Psychosocial Questionnaire), o instrumento que o mercado
 * brasileiro de SST está convergindo para usar na avaliação exigida pelo
 * Anexo II da NR-01 (fiscalização a partir de 26/05/2026 — ver proposta,
 * seção 3). NÃO é o COPSOQ III completo (148 itens, 8 domínios, 45
 * dimensões) nem uma tradução licenciada dele — é uma versão curta
 * própria, organizada nos mesmos sete domínios de alto nível, pensada
 * para caber num pulso trimestral sem fadiga de resposta.
 *
 * Antes de usar isto para o PGR de uma empresa real: (1) valide os itens
 * com um profissional de SST/psicologia do trabalho, (2) rode com uma
 * amostra piloto e calcule consistência interna por domínio, (3) trate os
 * cortes de risco abaixo como provisórios — mesma ressalva que a norma
 * teórica do DISC 2.0 (ver disc-engine/README.md).
 *
 * Escala de resposta: 0 (nunca) a 4 (sempre), como no COPSOQ.
 */

export type PsychosocialDomain =
  | "exigencias_trabalho"
  | "organizacao_conteudo"
  | "relacoes_lideranca"
  | "interface_trabalho_individuo"
  | "comportamentos_ofensivos"
  | "valores_justica"
  | "saude_bemestar";

export interface PsychosocialItem {
  id: string;
  domain: PsychosocialDomain;
  text: string;
  /** true = concordância ALTA significa risco BAIXO (ex.: autonomia) — o
   *  escore deste item é invertido antes de entrar na média de risco do
   *  domínio. false = concordância alta significa risco alto direto. */
  reversed: boolean;
}

export const PSYCHOSOCIAL_DOMAIN_LABELS: Record<PsychosocialDomain, string> = {
  exigencias_trabalho: "Exigências do trabalho",
  organizacao_conteudo: "Organização e conteúdo do trabalho",
  relacoes_lideranca: "Relações sociais e liderança",
  interface_trabalho_individuo: "Interface trabalho-indivíduo",
  comportamentos_ofensivos: "Comportamentos ofensivos",
  valores_justica: "Valores e justiça no trabalho",
  saude_bemestar: "Saúde e bem-estar (resultado, não fator de risco)",
};

export const PSYCHOSOCIAL_ITEMS: readonly PsychosocialItem[] = [
  // --- Exigências do trabalho (quantitativa, ritmo, cognitiva, emocional) ---
  { id: "et1", domain: "exigencias_trabalho", reversed: false, text: "Com que frequência você não consegue dar conta do volume de trabalho no prazo esperado?" },
  { id: "et2", domain: "exigencias_trabalho", reversed: false, text: "Com que frequência seu ritmo de trabalho é definido por algo fora do seu controle (sistema, fila, outra pessoa)?" },
  { id: "et3", domain: "exigencias_trabalho", reversed: false, text: "Com que frequência seu trabalho exige atenção e concentração intensas por longos períodos?" },
  { id: "et4", domain: "exigencias_trabalho", reversed: false, text: "Com que frequência seu trabalho te coloca em situações emocionalmente desgastantes?" },

  // --- Organização e conteúdo do trabalho (autonomia, sentido, desenvolvimento) ---
  { id: "oc1", domain: "organizacao_conteudo", reversed: true, text: "Você tem liberdade para decidir COMO fazer o seu trabalho?" },
  { id: "oc2", domain: "organizacao_conteudo", reversed: true, text: "Seu trabalho tem sentido para você, além do salário?" },
  { id: "oc3", domain: "organizacao_conteudo", reversed: true, text: "Você tem oportunidade de aprender coisas novas no seu trabalho?" },
  { id: "oc4", domain: "organizacao_conteudo", reversed: true, text: "Você entende com clareza o que se espera do seu trabalho?" },

  // --- Relações sociais e liderança (apoio, qualidade da liderança, reconhecimento) ---
  { id: "rl1", domain: "relacoes_lideranca", reversed: true, text: "Você recebe apoio de colegas quando precisa?" },
  { id: "rl2", domain: "relacoes_lideranca", reversed: true, text: "Sua liderança direta ajuda a organizar e priorizar o trabalho quando necessário?" },
  { id: "rl3", domain: "relacoes_lideranca", reversed: true, text: "Seu esforço é reconhecido por quem está acima de você na hierarquia?" },
  { id: "rl4", domain: "relacoes_lideranca", reversed: true, text: "Você confia nas informações que recebe da liderança?" },

  // --- Interface trabalho-indivíduo (conflito trabalho-família, insegurança) ---
  { id: "ti1", domain: "interface_trabalho_individuo", reversed: false, text: "Com que frequência o trabalho consome tempo e energia que você gostaria de dar à família ou à vida pessoal?" },
  { id: "ti2", domain: "interface_trabalho_individuo", reversed: false, text: "Com que frequência você se preocupa com a possibilidade de ficar desempregado(a) ou ter o cargo extinto?" },
  { id: "ti3", domain: "interface_trabalho_individuo", reversed: false, text: "Com que frequência é difícil desligar do trabalho fora do horário (mensagens, e-mail, plantão informal)?" },

  // --- Comportamentos ofensivos (assédio moral/sexual, violência) ---
  // Aqui a escala muda de propósito: não é "concordo/discordo", é frequência
  // de exposição — qualquer valor acima de 0 já é um sinal a investigar,
  // não só a média do domínio.
  { id: "co1", domain: "comportamentos_ofensivos", reversed: false, text: "Com que frequência você foi alvo de humilhação, ironia ou exclusão proposital no trabalho nos últimos 6 meses?" },
  { id: "co2", domain: "comportamentos_ofensivos", reversed: false, text: "Com que frequência você presenciou ou foi alvo de comentário ou abordagem de natureza sexual indesejada no trabalho?" },
  { id: "co3", domain: "comportamentos_ofensivos", reversed: false, text: "Com que frequência você foi alvo de ameaça, grito ou agressão verbal no trabalho?" },

  // --- Valores e justiça no trabalho (confiança, justiça organizacional) ---
  { id: "vj1", domain: "valores_justica", reversed: true, text: "As decisões que afetam seu trabalho (promoção, distribuição de tarefas) são tomadas de forma justa?" },
  { id: "vj2", domain: "valores_justica", reversed: true, text: "Você confia que a empresa cumpre o que promete?" },

  // --- Saúde e bem-estar (resultado — acompanhado, não tratado como "fator de risco" em si) ---
  { id: "sb1", domain: "saude_bemestar", reversed: false, text: "Com que frequência você se sente esgotado(a) emocionalmente por causa do trabalho?" },
  { id: "sb2", domain: "saude_bemestar", reversed: false, text: "Com que frequência o trabalho prejudica seu sono?" },
  { id: "sb3", domain: "saude_bemestar", reversed: false, text: "Com que frequência você se sente ansioso(a) ao pensar no trabalho do dia seguinte?" },
] as const;

export const RESPONSE_SCALE = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Raramente" },
  { value: 2, label: "Às vezes" },
  { value: 3, label: "Frequentemente" },
  { value: 4, label: "Sempre" },
] as const;
