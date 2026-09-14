import { describe, expect, it } from "vitest";
import { MemoryEntityStore } from "../src/store/memory-store.js";
import { AtsService, TransitionError } from "../src/ats/service.js";
import { canTransition } from "../src/ats/pipeline.js";

describe("pipeline (máquina de estados)", () => {
  it("permite avançar só para o próximo estágio da ordem canônica", () => {
    expect(canTransition("applied", "screening")).toBe(true);
    expect(canTransition("applied", "interview")).toBe(false); // pulou etapa
    expect(canTransition("screening", "applied")).toBe(false); // não anda para trás
  });

  it("rejected é alcançável de qualquer estágio não-terminal", () => {
    expect(canTransition("applied", "rejected")).toBe(true);
    expect(canTransition("interview", "rejected")).toBe(true);
  });

  it("hired e rejected são terminais — nenhuma transição sai deles", () => {
    expect(canTransition("hired", "rejected")).toBe(false);
    expect(canTransition("rejected", "applied")).toBe(false);
  });
});

describe("AtsService", () => {
  async function setup() {
    const store = new MemoryEntityStore();
    const ats = new AtsService(store);
    const posting = await ats.createPosting("org1", { title: "Vendedor", description: "..." });
    await ats.publishPosting(posting.id);
    const candidate = await ats.createCandidate("org1", { name: "João", email: "joao@x.com", source: "career_page" });
    const application = await ats.apply("org1", candidate.id, posting.id);
    return { store, ats, posting, candidate, application };
  }

  it("só lista vagas com status open na página de carreiras", async () => {
    const { ats } = await setup();
    const draft = await ats.createPosting("org1", { title: "Rascunho", description: "..." });
    const open = await ats.listOpenPostings("org1");
    expect(open.map((p) => p.data.title)).toEqual(["Vendedor"]);
    expect(open.some((p) => p.id === draft.id)).toBe(false);
  });

  it("transitionStage avança o funil e registra histórico", async () => {
    const { ats, application } = await setup();
    const updated = await ats.transitionStage(application.id, "screening", { by: "recrutador@x.com" });
    expect(updated.data.stage).toBe("screening");
    expect(updated.data.history).toHaveLength(2);
    expect(updated.data.history[1]!.to).toBe("screening");
  });

  it("transitionStage rejeita pulo de etapa", async () => {
    const { ats, application } = await setup();
    await expect(ats.transitionStage(application.id, "offer")).rejects.toThrow(TransitionError);
  });

  it("hire cria a Person no core com o cargo da vaga", async () => {
    const { ats, application } = await setup();
    await ats.transitionStage(application.id, "screening");
    await ats.transitionStage(application.id, "interview");
    await ats.transitionStage(application.id, "offer");
    const { application: hiredApp, person } = await ats.hire("org1", application.id, "2026-09-15");
    expect(hiredApp.data.stage).toBe("hired");
    expect(person.data.name).toBe("João");
    expect(person.data.status).toBe("active");
  });

  it("fitFunnelCounts conta candidaturas por estágio", async () => {
    const { ats, posting, application } = await setup();
    await ats.transitionStage(application.id, "screening");
    const candidate2 = await ats.createCandidate("org1", { name: "Maria", email: "maria@x.com", source: "referral" });
    await ats.apply("org1", candidate2.id, posting.id);
    const counts = await ats.fitFunnelCounts("org1", posting.id);
    expect(counts.applied).toBe(1);
    expect(counts.screening).toBe(1);
  });
});
