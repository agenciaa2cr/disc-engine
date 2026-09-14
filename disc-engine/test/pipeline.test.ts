import { describe, expect, it } from "vitest";
import { computeProfileFacts } from "../src/pipeline.js";
import { computeJobFit } from "../src/jobfit/fit.js";
import { computeValidity } from "../src/scoring/validity.js";
import { TETRAD_BLOCKS } from "../src/instrument/blocks.js";
import { buildAllReports } from "../src/reports/report.js";
import { computeTeamSummary } from "../src/reports/team.js";
import type { SessionResponses, TetradResponse } from "../src/types.js";

/** Gera 24 respostas onde uma dimensão fixa sempre vence como "mais" e
 *  outra sempre perde como "menos" — só para ter um protocolo completo e
 *  previsível em teste, não para simular um respondente realista. */
function fullPass(mostDim: "D" | "I" | "S" | "C", leastDim: "D" | "I" | "S" | "C"): TetradResponse[] {
  return TETRAD_BLOCKS.map((b) => ({ blockId: b.id, most: mostDim, least: leastDim, responseMs: 2000 }));
}

function completeResponses(): SessionResponses {
  return {
    adapted: fullPass("D", "S"),
    natural: fullPass("I", "C"),
    anchors: [
      { itemId: "a_d1", rating: 3 },
      { itemId: "a_d2", rating: 3 },
      { itemId: "a_i1", rating: 5 },
      { itemId: "a_i2", rating: 5 },
      { itemId: "a_s1", rating: 3 },
      { itemId: "a_s2", rating: 3 },
      { itemId: "a_c1", rating: 1 },
      { itemId: "a_c2", rating: 1 },
    ],
  };
}

describe("computeProfileFacts (pipeline completo)", () => {
  it("produz um objeto de fatos coerente com respostas completas", () => {
    const facts = computeProfileFacts(completeResponses());

    expect(facts.pattern.primary).toBe("I"); // dominante no gráfico natural
    expect(facts.percentile.adapted.D).toBeGreaterThan(facts.percentile.adapted.S);
    expect(facts.weakest).toBe("C"); // sempre "menos" na passada natural
    expect(facts.validity.flags).not.toContain("respostas_incompletas");
  });

  it("sinaliza respostas_incompletas quando um bloco fica sem resposta", () => {
    const responses = completeResponses();
    responses.adapted = responses.adapted.slice(0, 20); // faltam 4 blocos
    const facts = computeProfileFacts(responses);
    expect(facts.validity.flags).toContain("respostas_incompletas");
    expect(facts.validity.valid).toBe(false);
  });

  it("detecta flatline quando a mesma dimensão é sempre 'mais'", () => {
    const flags = computeValidity({
      adaptedResponses: fullPass("D", "S"),
      naturalResponses: fullPass("D", "S"),
      anchorResponses: [],
      expectedBlockCount: TETRAD_BLOCKS.length,
      percentileNatural: { D: 99, I: 1, S: 1, C: 1 },
    });
    expect(flags.flatlineDetected).toBe(true);
    expect(flags.flags).toContain("flatline");
  });
});

describe("computeJobFit", () => {
  it("aderência 100 quando o candidato bate exatamente com o alvo", () => {
    const fit = computeJobFit({ D: 60, I: 60, S: 60, C: 60 }, { profile: { D: 60, I: 60, S: 60, C: 60 } });
    expect(fit.overall).toBe(100);
    expect(fit.band).toBe("alta");
  });

  it("aderência cai proporcionalmente à distância ponderada", () => {
    const fit = computeJobFit({ D: 90, I: 50, S: 50, C: 50 }, { profile: { D: 50, I: 50, S: 50, C: 50 } });
    // gap de 40 numa dimensão com peso 0.25 → distância ponderada 10 → 90/100
    expect(fit.overall).toBe(90);
    expect(fit.gaps.D).toBe(40);
  });

  it("nunca gera aderência negativa mesmo com distância extrema", () => {
    const fit = computeJobFit({ D: 99, I: 1, S: 99, C: 1 }, { profile: { D: 1, I: 99, S: 1, C: 99 } });
    expect(fit.overall).toBeGreaterThanOrEqual(0);
  });
});

describe("buildAllReports", () => {
  it("gera as quatro versões e a versão do candidato nunca inclui a camada de entrevista", () => {
    const facts = computeProfileFacts(completeResponses());
    const reports = buildAllReports("sess-teste", facts);
    expect(Object.keys(reports).sort()).toEqual(["candidato", "equipe", "gestor", "recrutador"]);
    expect(reports.candidato.sections.some((s) => s.layer === "interview")).toBe(false);
    expect(reports.recrutador.sections.some((s) => s.layer === "interview")).toBe(true);
  });

  it("é determinístico: rodar duas vezes com os mesmos dados dá o mesmo laudo", () => {
    const facts = computeProfileFacts(completeResponses());
    const r1 = buildAllReports("sess-determinismo", facts);
    const r2 = buildAllReports("sess-determinismo", facts);
    expect(r1.recrutador.sections).toEqual(r2.recrutador.sections);
  });
});

describe("computeTeamSummary", () => {
  it("agrega múltiplos perfis sem expor identidade individual", () => {
    const facts1 = computeProfileFacts(completeResponses());
    const facts2 = computeProfileFacts({ adapted: fullPass("C", "I"), natural: fullPass("S", "D"), anchors: [] });
    const summary = computeTeamSummary([facts1, facts2]);
    expect(summary.peopleCount).toBe(2);
    expect(Object.keys(summary)).not.toContain("names");
    expect(summary.narrative.length).toBeGreaterThan(0);
  });

  it("lida com lista vazia sem lançar exceção", () => {
    const summary = computeTeamSummary([]);
    expect(summary.peopleCount).toBe(0);
    expect(summary.narrative[0]).toContain("Nenhum perfil");
  });
});
