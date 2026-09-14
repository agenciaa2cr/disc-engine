// Tipos centrais do motor DISC 2.0.
// Nada aqui depende de IA, rede ou serviço externo — é matemática e regras.

export type Dimension = "D" | "I" | "S" | "C";
export const DIMENSIONS: readonly Dimension[] = ["D", "I", "S", "C"] as const;

/** As duas passadas do instrumento sobre o mesmo banco de blocos. */
export type Pass = "adapted" | "natural";

export type Audience = "candidato" | "recrutador" | "gestor" | "equipe";
export const AUDIENCES: readonly Audience[] = ["candidato", "recrutador", "gestor", "equipe"] as const;

/** Um bloco tetrádico: quatro afirmações, uma por dimensão. */
export interface TetradBlock {
  id: string;
  statements: Record<Dimension, string>;
}

/** Item-âncora normativo (Likert 1–5), usado para checagem de consistência. */
export interface AnchorItem {
  id: string;
  dimension: Dimension;
  text: string;
}

/** Resposta a um bloco tetrádico: qual afirmação é "mais" e qual é "menos" parecida. */
export interface TetradResponse {
  blockId: string;
  most: Dimension;
  least: Dimension;
  /** tempo de resposta em ms, opcional — alimenta os índices de validade */
  responseMs?: number;
}

export interface AnchorResponse {
  itemId: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface SessionResponses {
  adapted: TetradResponse[];
  natural: TetradResponse[];
  anchors: AnchorResponse[];
}

export type ScoreVector = Record<Dimension, number>;
export type PercentileVector = Record<Dimension, number>;

export type TensionLevel = "baixa" | "media" | "alta";
export type SocialDesirabilityLevel = "baixa" | "media" | "alta";

export interface ValidityReport {
  flags: ValidityFlag[];
  consistencyIndex: number; // 0–1, concordância entre âncoras normativas e escores ipsativos
  socialDesirability: SocialDesirabilityLevel;
  flatlineDetected: boolean;
  fastResponseRatio: number; // proporção de blocos respondidos abaixo do limiar de tempo
  valid: boolean; // false quando o protocolo não deve ser interpretado sem ressalva
}

export type ValidityFlag =
  | "flatline"
  | "tempo_anomalo"
  | "baixa_consistencia"
  | "desejabilidade_social_alta"
  | "respostas_incompletas";

export interface PatternClassification {
  primary: Dimension;
  secondary: Dimension;
  code: string; // ex.: "D/I"
  patternId: string; // chave para a biblioteca de conteúdo, ex.: "pattern_D_I"
  label: string; // nome de exibição, ex.: "Realizador Persuasivo"
}

export interface AmplitudeReport {
  adapted: number; // maior percentil − menor percentil, passada adaptada
  natural: number;
  level: "estreita" | "moderada" | "ampla";
}

export interface FlexibilityReport {
  adapted: number; // nº de dimensões na faixa 35–65 (percentil)
  natural: number;
}

export interface TensionReport {
  byDim: Record<Dimension, number>; // |adaptado − natural| por dimensão, em percentil
  signedByDim: Record<Dimension, number>; // adaptado − natural (com sinal)
  overall: number; // soma das diferenças absolutas
  level: TensionLevel;
  maxDim: Dimension;
}

export interface JobTarget {
  /** perfil-alvo da vaga, em percentil desejado por dimensão (0–100) */
  profile: PercentileVector;
  /** peso relativo de cada dimensão na aderência (soma não precisa ser 1; é normalizado) */
  weights?: Partial<Record<Dimension, number>>;
  roleName?: string;
}

export interface JobFitReport {
  roleName?: string;
  overall: number; // 0–100, aderência ponderada
  gaps: Record<Dimension, number>; // perfil_candidato − perfil_alvo, com sinal
  band: "baixa" | "moderada" | "alta";
}

/** O conjunto completo de fatos derivados de um protocolo — a "verdade" que
 *  o avaliador de regras consulta para decidir quais blocos de texto entram no laudo. */
export interface ProfileFacts {
  raw: { adapted: ScoreVector; natural: ScoreVector };
  percentile: { adapted: PercentileVector; natural: PercentileVector };
  delta: TensionReport;
  amplitude: AmplitudeReport;
  flexibility: FlexibilityReport;
  pattern: PatternClassification;
  /** dimensão de percentil mais baixo no Gráfico II (natural) — usada para orientar o PDI */
  weakest: Dimension;
  validity: ValidityReport;
  jobFit?: JobFitReport;
}

export type ContentLayer =
  | "identity"
  | "dimension"
  | "pair"
  | "adaptation"
  | "stress"
  | "context"
  | "jobfit"
  | "interview"
  | "development"
  | "quality";

/** Condição estruturada — nunca uma string avaliada como código.
 *  Isso é deliberado: a biblioteca de conteúdo é dado, não lógica executável,
 *  então uma entrada malformada não pode virar execução arbitrária. */
export type Condition =
  | { op: "always" }
  | { op: "cmp"; field: string; cmp: "gte" | "lte" | "gt" | "lt" | "eq" | "neq"; value: number }
  | { op: "eqStr"; field: string; value: string }
  | { op: "includes"; field: string; value: string }
  | { op: "exists"; field: string }
  | { op: "bool"; field: string; value: boolean }
  | { op: "and"; conditions: Condition[] }
  | { op: "or"; conditions: Condition[] }
  | { op: "not"; condition: Condition };

export interface ContentBlock {
  id: string;
  layer: ContentLayer;
  /** prioridade de exibição dentro da camada — maior primeiro */
  priority: number;
  condition: Condition;
  /** usadas para deduplicação: um bloco de prioridade menor que compartilhe uma tag
   *  com um bloco já incluído de prioridade maior é descartado */
  dedupeTags?: string[];
  /** camadas de audiência que recebem este bloco; ausente = todas */
  audiences?: Audience[];
  /** variantes redacionais — a escolha é determinística por respondente, não aleatória */
  variants: string[];
}

export interface ComposedSection {
  layer: ContentLayer;
  paragraphs: string[];
}

export interface Report {
  sessionId: string;
  audience: Audience;
  generatedAt: string;
  engineVersion: string;
  contentLibraryVersion: string;
  pattern: PatternClassification;
  sections: ComposedSection[];
  validity: ValidityReport;
}
