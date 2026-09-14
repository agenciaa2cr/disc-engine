import { describe, expect, it } from "vitest";
import { MemoryEntityStore } from "../src/store/memory-store.js";
import { ClimateService, SurveyError } from "../src/climate/service.js";
import { MemorySurveyResponseStore } from "../src/climate/response-store.js";
import { computeDomainRiskScores, computeEnps, enforceAnonymity } from "../src/climate/aggregate.js";
import { PSYCHOSOCIAL_ITEMS } from "../src/climate/psychosocial-questionnaire.js";

function buildSubmission(overrides: Record<string, number> = {}) {
  // resposta "neutra" (2 em tudo) como base, sobrescrita item a item pelo teste
  const answers: Record<string, number> = {};
  for (const item of PSYCHOSOCIAL_ITEMS) answers[item.id] = 2;
  return { surveyId: "s1", answers: { ...answers, ...overrides } };
}

describe("anonimato — enforceAnonymity", () => {
  it("recusa agregar abaixo do limiar", () => {
    expect(enforceAnonymity([1, 2, 3], 5)).toBe(false);
    expect(enforceAnonymity([1, 2, 3, 4, 5], 5)).toBe(true);
  });
});

describe("computeDomainRiskScores", () => {
  it("retorna undefined quando não há respostas suficientes para o limiar", () => {
    const responses = [buildSubmission(), buildSubmission()];
    expect(computeDomainRiskScores(responses, 5)).toBeUndefined();
  });

  it("inverte itens 'reversed' antes de calcular o risco (alta autonomia = baixo risco)", () => {
    // oc1 é reversed=true ("você tem liberdade para decidir como fazer seu trabalho?")
    // resposta 4 (sempre) num item reversed deveria produzir risco BAIXO, não alto
    const highAutonomy = Array.from({ length: 5 }, () => buildSubmission({ oc1: 4, oc2: 4, oc3: 4, oc4: 4 }));
    const result = computeDomainRiskScores(highAutonomy, 5)!;
    const org = result.find((r) => r.domain === "organizacao_conteudo")!;
    expect(org.score).toBeLessThan(30);
    expect(org.band).toBe("baixo");
  });

  it("não inverte itens de exigência (frequência alta = risco alto direto)", () => {
    const highDemand = Array.from({ length: 5 }, () => buildSubmission({ et1: 4, et2: 4, et3: 4, et4: 4 }));
    const result = computeDomainRiskScores(highDemand, 5)!;
    const dem = result.find((r) => r.domain === "exigencias_trabalho")!;
    expect(dem.score).toBeGreaterThan(70);
    expect(dem.band).toBe("alto");
  });

  it("sinaliza criticalExposureFlag em comportamentos ofensivos mesmo com exposição baixa", () => {
    const oneExposure = Array.from({ length: 5 }, (_, i) => buildSubmission(i === 0 ? { co1: 1, co2: 0, co3: 0 } : { co1: 0, co2: 0, co3: 0 }));
    const result = computeDomainRiskScores(oneExposure, 5)!;
    const offensive = result.find((r) => r.domain === "comportamentos_ofensivos")!;
    expect(offensive.criticalExposureFlag).toBe(true);
    // mesmo com média de risco baixa (só 1 de 5 respondentes relatou, valor mínimo)
    expect(offensive.band).toBe("baixo");
  });
});

describe("computeEnps", () => {
  it("calcula promotores, neutros, detratores e o score final", () => {
    const scores = [9, 10, 8, 6, 3, 9]; // 3 promotores, 1 neutro, 2 detratores
    const result = computeEnps(scores, 5)!;
    expect(result.promoters).toBe(3);
    expect(result.passives).toBe(1);
    expect(result.detractors).toBe(2);
    expect(result.score).toBe(Math.round(((3 - 2) / 6) * 100));
  });

  it("respeita o limiar de anonimato", () => {
    expect(computeEnps([9, 8], 5)).toBeUndefined();
  });
});

describe("ClimateService — fluxo completo", () => {
  it("recusa resposta com item desconhecido no questionário psicossocial", async () => {
    const store = new MemoryEntityStore();
    const climate = new ClimateService(store, new MemorySurveyResponseStore());
    const survey = await climate.createSurvey("org1", { type: "psicossocial", title: "Pulso Q3", anonymityThreshold: 5, startDate: "2026-09-01" });
    await climate.openSurvey(survey.id);
    await expect(climate.submitResponse("org1", { surveyId: survey.id, answers: { item_inexistente: 3 } })).rejects.toThrow(SurveyError);
  });

  it("recusa resposta em pesquisa que não está aberta", async () => {
    const store = new MemoryEntityStore();
    const climate = new ClimateService(store, new MemorySurveyResponseStore());
    const survey = await climate.createSurvey("org1", { type: "enps", title: "eNPS", anonymityThreshold: 5, startDate: "2026-09-01" });
    await expect(climate.submitResponse("org1", { surveyId: survey.id, answers: { score: 9 } })).rejects.toThrow(SurveyError);
  });

  it("plano de ação nasce com status 'planned' e pode avançar", async () => {
    const store = new MemoryEntityStore();
    const climate = new ClimateService(store, new MemorySurveyResponseStore());
    const survey = await climate.createSurvey("org1", { type: "psicossocial", title: "Pulso", anonymityThreshold: 5, startDate: "2026-09-01" });
    const plan = await climate.createActionPlan("org1", { surveyId: survey.id, riskCategory: "exigencias_trabalho", action: "Redistribuir carga do time X" });
    expect(plan.data.status).toBe("planned");
    const updated = await climate.updateActionPlanStatus(plan.id, "in_progress");
    expect(updated!.data.status).toBe("in_progress");
  });

  it("psychosocialRiskReport devolve undefined sem respostas suficientes, e o relatório real quando o limiar é atingido", async () => {
    const store = new MemoryEntityStore();
    const climate = new ClimateService(store, new MemorySurveyResponseStore());
    const survey = await climate.createSurvey("org1", { type: "psicossocial", title: "Pulso", anonymityThreshold: 3, startDate: "2026-09-01" });
    await climate.openSurvey(survey.id);

    expect(await climate.psychosocialRiskReport("org1", survey.id)).toBeUndefined();

    for (let i = 0; i < 3; i++) {
      await climate.submitResponse("org1", { ...buildSubmission(), surveyId: survey.id });
    }

    const report = await climate.psychosocialRiskReport("org1", survey.id);
    expect(report).toBeDefined();
    expect(report!.length).toBeGreaterThan(0);
  });
});
