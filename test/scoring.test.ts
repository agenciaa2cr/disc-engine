import { describe, expect, it } from "vitest";
import { isIpsativelyBalanced, maxDimension, minDimension, scoreRawPass } from "../src/scoring/score.js";
import { rawToPercentile, theoreticalNormTable, scoreVectorToPercentiles } from "../src/scoring/norms.js";
import { computeAmplitude, computeFlexibility, computeTension, classifyPattern, findWeakest } from "../src/scoring/indices.js";
import type { TetradResponse } from "../src/types.js";

describe("scoreRawPass", () => {
  it("soma +1 para 'mais' e -1 para 'menos', 0 para as demais", () => {
    const responses: TetradResponse[] = [
      { blockId: "b01", most: "D", least: "C" },
      { blockId: "b02", most: "I", least: "D" },
    ];
    const score = scoreRawPass(responses);
    expect(score).toEqual({ D: 0, I: 1, S: 0, C: -1 });
  });

  it("a soma das quatro dimensões é sempre zero (propriedade ipsativa)", () => {
    const responses: TetradResponse[] = [
      { blockId: "b01", most: "D", least: "C" },
      { blockId: "b02", most: "S", least: "I" },
      { blockId: "b03", most: "D", least: "S" },
    ];
    const score = scoreRawPass(responses);
    expect(isIpsativelyBalanced(score)).toBe(true);
  });

  it("rejeita bloco onde 'mais' e 'menos' são a mesma dimensão", () => {
    expect(() => scoreRawPass([{ blockId: "b01", most: "D", least: "D" }])).toThrow();
  });

  it("maxDimension e minDimension acham os extremos", () => {
    const score = { D: 5, I: -2, S: 1, C: -4 };
    expect(maxDimension(score)).toBe("D");
    expect(minDimension(score)).toBe("C");
  });
});

describe("rawToPercentile", () => {
  it("um escore igual à média cai perto do percentil 50", () => {
    expect(rawToPercentile(0, 0, 3.46)).toBe(50);
  });

  it("é monotônico crescente em relação ao escore bruto", () => {
    const p1 = rawToPercentile(-5, 0, 3.46);
    const p2 = rawToPercentile(0, 0, 3.46);
    const p3 = rawToPercentile(5, 0, 3.46);
    expect(p1).toBeLessThan(p2);
    expect(p2).toBeLessThan(p3);
  });

  it("nunca sai da faixa 1–99, mesmo em escore extremo", () => {
    expect(rawToPercentile(999, 0, 3.46)).toBe(99);
    expect(rawToPercentile(-999, 0, 3.46)).toBe(1);
  });

  it("scoreVectorToPercentiles usa a norma teórica por padrão", () => {
    const percentiles = scoreVectorToPercentiles({ D: 0, I: 0, S: 0, C: 0 }, "natural", theoreticalNormTable());
    expect(percentiles).toEqual({ D: 50, I: 50, S: 50, C: 50 });
  });
});

describe("índices derivados", () => {
  it("computeTension calcula delta absoluto e sinalizado corretamente", () => {
    const adapted = { D: 80, I: 40, S: 30, C: 60 };
    const natural = { D: 50, I: 40, S: 55, C: 60 };
    const tension = computeTension(adapted, natural);
    expect(tension.signedByDim.D).toBe(30);
    expect(tension.byDim.D).toBe(30);
    expect(tension.signedByDim.S).toBe(-25);
    expect(tension.byDim.S).toBe(25);
    expect(tension.byDim.I).toBe(0);
    expect(tension.overall).toBe(30 + 0 + 25 + 0);
    expect(tension.maxDim).toBe("D");
  });

  it("computeAmplitude usa o maior espalhamento entre as duas passadas", () => {
    const adapted = { D: 90, I: 40, S: 30, C: 60 };
    const natural = { D: 55, I: 50, S: 45, C: 50 };
    const amp = computeAmplitude(adapted, natural);
    expect(amp.adapted).toBe(60); // 90-30
    expect(amp.natural).toBe(10); // 55-45
    expect(amp.level).toBe("ampla"); // usa o maior dos dois (60), que já passa do limiar de 55
  });

  it("computeFlexibility conta dimensões na faixa 35–65", () => {
    const adapted = { D: 50, I: 90, S: 10, C: 60 };
    const natural = { D: 40, I: 40, S: 40, C: 40 };
    const flex = computeFlexibility(adapted, natural);
    expect(flex.adapted).toBe(2); // D=50, C=60
    expect(flex.natural).toBe(4);
  });

  it("classifyPattern escolhe as duas dimensões mais altas do gráfico natural", () => {
    const natural = { D: 90, I: 70, S: 20, C: 10 };
    const amp = computeAmplitude(natural, natural);
    const pattern = classifyPattern(natural, amp);
    expect(pattern.primary).toBe("D");
    expect(pattern.secondary).toBe("I");
    expect(pattern.code).toBe("D/I");
    expect(pattern.patternId).toBe("pattern_D_I");
  });

  it("classifyPattern retorna perfil equilibrado quando a amplitude é estreita", () => {
    const natural = { D: 52, I: 48, S: 50, C: 51 };
    const pattern = classifyPattern(natural, { adapted: 4, natural: 4, level: "estreita" });
    expect(pattern.patternId).toBe("pattern_equilibrado");
  });

  it("findWeakest acha a dimensão de percentil mais baixo", () => {
    expect(findWeakest({ D: 80, I: 20, S: 60, C: 40 })).toBe("I");
  });
});
