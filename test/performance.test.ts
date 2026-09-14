import { describe, expect, it } from "vitest";
import { MemoryEntityStore } from "../src/store/memory-store.js";
import { PerformanceService, GoalError } from "../src/performance/service.js";
import { boxLabel, boxNumber } from "../src/performance/nine-box.js";

describe("PerformanceService — metas e OKRs", () => {
  it("rejeita key_result sem parentId válido apontando para um objective", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    await expect(
      perf.createGoal("org1", { ownerId: "p1", title: "KR solto", type: "key_result", period: "2026-Q3" }),
    ).rejects.toThrow(GoalError);
  });

  it("checkIn atualiza currentValue e deriva status pela proporção da meta", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    const objective = await perf.createGoal("org1", { ownerId: "p1", title: "Crescer receita", type: "objective", period: "2026-Q3" });
    const kr = await perf.createGoal("org1", { ownerId: "p1", title: "Fechar 10 contas", type: "key_result", parentId: objective.id, targetValue: 10, period: "2026-Q3" });

    const almostDone = await perf.checkIn(kr.id, 9);
    expect(almostDone.goal.data.status).toBe("on_track"); // 90%

    const done = await perf.checkIn(kr.id, 10);
    expect(done.goal.data.status).toBe("done");

    const offTrack = await perf.checkIn(kr.id, 5);
    expect(offTrack.goal.data.status).toBe("off_track"); // 50% < 0.6, abaixo do limiar de at_risk

    const atRisk = await perf.checkIn(kr.id, 7);
    expect(atRisk.goal.data.status).toBe("at_risk"); // 70% -> entre 0.6 e 0.9
  });

  it("objectiveProgress é a média do progresso dos key results", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    const objective = await perf.createGoal("org1", { ownerId: "p1", title: "Objetivo", type: "objective", period: "2026-Q3" });
    const kr1 = await perf.createGoal("org1", { ownerId: "p1", title: "KR1", type: "key_result", parentId: objective.id, targetValue: 10, period: "2026-Q3" });
    const kr2 = await perf.createGoal("org1", { ownerId: "p1", title: "KR2", type: "key_result", parentId: objective.id, targetValue: 100, period: "2026-Q3" });
    await perf.checkIn(kr1.id, 10); // 100%
    await perf.checkIn(kr2.id, 50); // 50%
    const progress = await perf.objectiveProgress("org1", objective.id);
    expect(progress).toBeCloseTo(0.75, 5);
  });
});

describe("PerformanceService — feedback e visibilidade", () => {
  it("feedback privado só aparece para o próprio destinatário", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    await perf.giveFeedback("org1", { fromPersonId: "a", toPersonId: "b", type: "constructive", visibility: "private", text: "..." });

    const asRecipient = await perf.listFeedbackFor("org1", "b", "b", false);
    expect(asRecipient).toHaveLength(1);

    const asStranger = await perf.listFeedbackFor("org1", "b", "c", false);
    expect(asStranger).toHaveLength(0);

    const asManager = await perf.listFeedbackFor("org1", "b", "c", true);
    expect(asManager).toHaveLength(0); // "private" não abre nem para gestor — só "manager" ou "public" abrem
  });

  it("feedback 'manager' aparece para quem é sinalizado como gestor", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    await perf.giveFeedback("org1", { fromPersonId: "a", toPersonId: "b", type: "praise", visibility: "manager", text: "..." });
    const asManager = await perf.listFeedbackFor("org1", "b", "c", true);
    expect(asManager).toHaveLength(1);
  });
});

describe("PerformanceService — PDI", () => {
  it("fecha o PDI automaticamente quando todas as ações ficam done", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    const pdi = await perf.createPdi("org1", { personId: "p1", actions: [{ description: "A", status: "pending" }, { description: "B", status: "pending" }] });
    const afterFirst = await perf.updatePdiAction(pdi.id, 0, "done");
    expect(afterFirst!.data.status).toBe("open");
    const afterSecond = await perf.updatePdiAction(pdi.id, 1, "done");
    expect(afterSecond!.data.status).toBe("closed");
  });
});

describe("PerformanceService — ciclo de avaliação", () => {
  it("cycleCompletionRate reflete a proporção de avaliações submetidas", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    const cycle = await perf.createReviewCycle("org1", { name: "2026 H2", periodStart: "2026-07-01", periodEnd: "2026-12-31", type: "180" });
    const a1 = await perf.assignReviewer("org1", cycle.id, "subject1", "reviewer1", "manager");
    await perf.assignReviewer("org1", cycle.id, "subject1", "reviewer2", "peer");

    expect(await perf.cycleCompletionRate("org1", cycle.id)).toBe(0);
    await perf.submitReview(a1.id, [{ competencyId: "c1", score: 4 }]);
    expect(await perf.cycleCompletionRate("org1", cycle.id)).toBeCloseTo(0.5, 5);
  });
});

describe("9-box", () => {
  it("calcula número e rótulo da caixa a partir de desempenho × potencial", () => {
    expect(boxNumber(3, 3)).toBe(9);
    expect(boxLabel(3, 3)).toBe("Estrela");
    expect(boxLabel(1, 1)).toBe("Risco");
  });

  it("placeNineBox persiste a colocação e devolve caixa/rótulo já calculados", async () => {
    const perf = new PerformanceService(new MemoryEntityStore());
    const cycle = await perf.createReviewCycle("org1", { name: "Ciclo", periodStart: "2026-01-01", periodEnd: "2026-06-30", type: "90" });
    const result = await perf.placeNineBox("org1", cycle.id, "p1", 3, 2, { placedBy: "gestor1" });
    expect(result.box).toBe(6);
    expect(result.label).toBe("Alto potencial");
  });
});
