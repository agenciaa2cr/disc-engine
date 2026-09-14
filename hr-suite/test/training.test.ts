import { describe, expect, it } from "vitest";
import { MemoryEntityStore } from "../src/store/memory-store.js";
import { TrainingService } from "../src/training/service.js";

describe("TrainingService — onboarding", () => {
  it("startOnboarding gera os 7 itens do template padrão 30/60/90", async () => {
    const training = new TrainingService(new MemoryEntityStore());
    const checklist = await training.startOnboarding("org1", "p1", "buddy1");
    expect(checklist.data.items).toHaveLength(7);
    expect(checklist.data.items.every((i) => !i.done)).toBe(true);
  });

  it("onboardingProgress reflete a fração de itens concluídos", async () => {
    const training = new TrainingService(new MemoryEntityStore());
    const checklist = await training.startOnboarding("org1", "p1");
    expect(await training.onboardingProgress(checklist.id)).toBe(0);
    await training.completeOnboardingItem(checklist.id, 0);
    const progress = await training.onboardingProgress(checklist.id);
    expect(progress).toBeCloseTo(1 / 7, 5);
  });
});

describe("TrainingService — sucessão", () => {
  it("benchStrength sinaliza risco quando titular é alto risco e não há sucessor pronto", async () => {
    const training = new TrainingService(new MemoryEntityStore());
    await training.createSuccessionPlan("org1", {
      roleId: "role1",
      incumbentPersonId: "titular1",
      incumbentLossRisk: "alto",
      candidatePersonId: "cand1",
      readiness: "developing",
    });
    const bench = await training.benchStrength("org1", "role1");
    expect(bench.readyNow).toBe(0);
    expect(bench.incumbentHighRiskNoSuccessor).toBe(true);
  });

  it("benchStrength não sinaliza risco quando já há sucessor pronto agora", async () => {
    const training = new TrainingService(new MemoryEntityStore());
    await training.createSuccessionPlan("org1", {
      roleId: "role1",
      incumbentLossRisk: "alto",
      candidatePersonId: "cand1",
      readiness: "ready_now",
    });
    const bench = await training.benchStrength("org1", "role1");
    expect(bench.readyNow).toBe(1);
    expect(bench.incumbentHighRiskNoSuccessor).toBe(false);
  });
});

describe("TrainingService — catálogo e matrícula", () => {
  it("completeEnrollment marca conclusão com timestamp", async () => {
    const training = new TrainingService(new MemoryEntityStore());
    const course = await training.createCourse("org1", { title: "Liderança 101" });
    const enrollment = await training.enroll("org1", "p1", course.id);
    expect(enrollment.data.status).toBe("enrolled");
    const completed = await training.completeEnrollment(enrollment.id, "https://cert.example/123");
    expect(completed!.data.status).toBe("completed");
    expect(completed!.data.certificateUrl).toContain("cert.example");
  });
});
