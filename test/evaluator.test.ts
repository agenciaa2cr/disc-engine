import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../src/content/evaluator.js";
import { interpolate } from "../src/content/interpolate.js";
import { and, boolIs, eqStr, gte, includesVal, lt, not, or } from "../src/content/helpers.js";
import type { ProfileFacts } from "../src/types.js";

const facts: ProfileFacts = {
  raw: { adapted: { D: 4, I: -2, S: -1, C: -1 }, natural: { D: 1, I: 3, S: -2, C: -2 } },
  percentile: { adapted: { D: 80, I: 30, S: 40, C: 45 }, natural: { D: 55, I: 75, S: 35, C: 20 } },
  delta: { byDim: { D: 25, I: 45, S: 5, C: 25 }, signedByDim: { D: 25, I: -45, S: 5, C: 25 }, overall: 100, level: "alta", maxDim: "I" },
  amplitude: { adapted: 50, natural: 55, level: "ampla" },
  flexibility: { adapted: 2, natural: 1 },
  pattern: { primary: "I", secondary: "D", code: "I/D", patternId: "pattern_I_D", label: "Persuasivo Realizador" },
  weakest: "C",
  validity: { flags: ["tempo_anomalo"], consistencyIndex: 0.6, socialDesirability: "media", flatlineDetected: false, fastResponseRatio: 0.4, valid: true },
};

describe("evaluateCondition", () => {
  it("always sempre casa", () => {
    expect(evaluateCondition({ op: "always" }, facts)).toBe(true);
  });

  it("cmp compara número resolvido do caminho", () => {
    expect(evaluateCondition(gte("percentile.adapted.D", 80), facts)).toBe(true);
    expect(evaluateCondition(gte("percentile.adapted.D", 81), facts)).toBe(false);
    expect(evaluateCondition(lt("percentile.natural.C", 21), facts)).toBe(true);
  });

  it("eqStr compara string resolvida", () => {
    expect(evaluateCondition(eqStr("pattern.primary", "I"), facts)).toBe(true);
    expect(evaluateCondition(eqStr("pattern.primary", "D"), facts)).toBe(false);
  });

  it("includes checa pertencimento em array", () => {
    expect(evaluateCondition(includesVal("validity.flags", "tempo_anomalo"), facts)).toBe(true);
    expect(evaluateCondition(includesVal("validity.flags", "flatline"), facts)).toBe(false);
  });

  it("bool compara booleano resolvido", () => {
    expect(evaluateCondition(boolIs("validity.valid", true), facts)).toBe(true);
    expect(evaluateCondition(boolIs("validity.flatlineDetected", true), facts)).toBe(false);
  });

  it("and/or/not compõem condições", () => {
    expect(evaluateCondition(and(gte("percentile.adapted.D", 50), eqStr("pattern.primary", "I")), facts)).toBe(true);
    expect(evaluateCondition(and(gte("percentile.adapted.D", 50), eqStr("pattern.primary", "C")), facts)).toBe(false);
    expect(evaluateCondition(or(eqStr("pattern.primary", "C"), eqStr("pattern.primary", "I")), facts)).toBe(true);
    expect(evaluateCondition(not(eqStr("pattern.primary", "C")), facts)).toBe(true);
  });

  it("uma condição malformada (campo inexistente) simplesmente não casa — nunca lança exceção nem executa código", () => {
    expect(evaluateCondition(gte("campo.que.nao.existe", 10), facts)).toBe(false);
    expect(evaluateCondition(eqStr("outro.campo.fantasma", "x"), facts)).toBe(false);
  });
});

describe("interpolate", () => {
  it("substitui {{campo}} pelo valor resolvido", () => {
    expect(interpolate("Percentil: {{percentile.adapted.D}}", facts)).toBe("Percentil: 80");
  });

  it("{{dim:campo}} traduz código de dimensão para rótulo por extenso", () => {
    expect(interpolate("Primária: {{dim:pattern.primary}}", facts)).toBe("Primária: Influência");
  });

  it("campo ausente vira string vazia, não 'undefined' literal", () => {
    expect(interpolate("X={{nao.existe}}", facts)).toBe("X=");
  });

  it("texto sem token passa direto", () => {
    expect(interpolate("sem token aqui", facts)).toBe("sem token aqui");
  });
});
