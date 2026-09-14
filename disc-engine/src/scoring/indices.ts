import { DIMENSIONS } from "../types.js";
import type {
  AmplitudeReport,
  Dimension,
  FlexibilityReport,
  PatternClassification,
  PercentileVector,
  TensionLevel,
  TensionReport,
} from "../types.js";

// ---------------------------------------------------------------------------
// Tensão / adaptação — a diferença entre o Gráfico I (adaptado) e o
// Gráfico II (natural). É o índice mais acionável do instrumento: mede
// esforço de ajuste, não a pessoa.
// ---------------------------------------------------------------------------

const TENSION_THRESHOLDS: Record<TensionLevel, number> = { baixa: 20, media: 45, alta: Infinity };

export function computeTension(adapted: PercentileVector, natural: PercentileVector): TensionReport {
  const byDim = {} as Record<Dimension, number>;
  const signedByDim = {} as Record<Dimension, number>;
  for (const d of DIMENSIONS) {
    signedByDim[d] = adapted[d] - natural[d];
    byDim[d] = Math.abs(signedByDim[d]);
  }
  const overall = DIMENSIONS.reduce((acc, d) => acc + byDim[d], 0);
  const maxDim = DIMENSIONS.reduce((best, d) => (byDim[d] > byDim[best] ? d : best), DIMENSIONS[0]!);
  const level: TensionLevel = overall < TENSION_THRESHOLDS.baixa ? "baixa" : overall < TENSION_THRESHOLDS.media ? "media" : "alta";
  return { byDim, signedByDim, overall, level, maxDim };
}

// ---------------------------------------------------------------------------
// Amplitude — distância entre a dimensão mais alta e a mais baixa. Perfis
// muito estreitos ("achatados") pedem laudo mais cauteloso: não há um
// traço claramente dominante para ancorar a leitura.
// ---------------------------------------------------------------------------

export function computeAmplitude(adapted: PercentileVector, natural: PercentileVector): AmplitudeReport {
  const spread = (v: PercentileVector) => Math.max(...DIMENSIONS.map((d) => v[d])) - Math.min(...DIMENSIONS.map((d) => v[d]));
  const a = spread(adapted);
  const n = spread(natural);
  const bigger = Math.max(a, n);
  const level = bigger < 30 ? "estreita" : bigger < 55 ? "moderada" : "ampla";
  return { adapted: a, natural: n, level };
}

// ---------------------------------------------------------------------------
// Flexibilidade — quantas dimensões caem na faixa média (35–65), como
// proxy de repertório comportamental amplo em vez de um estilo único.
// ---------------------------------------------------------------------------

export function computeFlexibility(adapted: PercentileVector, natural: PercentileVector): FlexibilityReport {
  const midCount = (v: PercentileVector) => DIMENSIONS.filter((d) => v[d] >= 35 && v[d] <= 65).length;
  return { adapted: midCount(adapted), natural: midCount(natural) };
}

// ---------------------------------------------------------------------------
// Padrão — classificação pelas duas dimensões mais altas do Gráfico II
// (natural). Doze combinações ordenadas + um rótulo especial para perfis
// muito achatados, onde apontar "o" padrão dominante seria enganoso.
//
// Nota: isto é uma classificação própria do DISC 2.0, não uma reprodução
// dos "15 padrões clássicos" registrados por fornecedores comerciais de
// DISC — o método (par de dimensões mais altas) é o mesmo princípio geral
// usado por várias ferramentas DISC, mas os rótulos e o corte são nossos.
// ---------------------------------------------------------------------------

const PATTERN_LABELS: Record<string, string> = {
  "D/I": "Realizador Persuasivo",
  "D/S": "Realizador Constante",
  "D/C": "Realizador Analítico",
  "I/D": "Persuasivo Realizador",
  "I/S": "Persuasivo Acolhedor",
  "I/C": "Persuasivo Criterioso",
  "S/D": "Estável Decidido",
  "S/I": "Estável Comunicativo",
  "S/C": "Estável Metódico",
  "C/D": "Criterioso Decidido",
  "C/I": "Criterioso Comunicativo",
  "C/S": "Criterioso Constante",
};

export function classifyPattern(natural: PercentileVector, amplitude: AmplitudeReport): PatternClassification {
  const ranked = DIMENSIONS.slice().sort((a, b) => natural[b] - natural[a] || DIMENSIONS.indexOf(a) - DIMENSIONS.indexOf(b));
  const [primary, secondary] = ranked as [Dimension, Dimension];
  const code = `${primary}/${secondary}`;

  if (amplitude.level === "estreita") {
    return { primary, secondary, code, patternId: "pattern_equilibrado", label: "Perfil Equilibrado" };
  }
  return { primary, secondary, code, patternId: `pattern_${primary}_${secondary}`, label: PATTERN_LABELS[code] ?? code };
}

/** Dimensão de percentil mais baixo no Gráfico II — usada para orientar o PDI. */
export function findWeakest(natural: PercentileVector): Dimension {
  return DIMENSIONS.reduce((worst, d) => (natural[d] < natural[worst] ? d : worst), DIMENSIONS[0]!);
}
