import { describe, expect, it } from "vitest";
import { MemoryEntityStore } from "../src/store/memory-store.js";
import { CoreService } from "../src/core/service.js";

describe("CoreService", () => {
  it("cria e lista pessoas por organização", async () => {
    const core = new CoreService(new MemoryEntityStore());
    await core.createPerson("org1", { name: "Ana", email: "ana@x.com", status: "active", source: "manual" });
    await core.createPerson("org2", { name: "Bia", email: "bia@x.com", status: "active", source: "manual" });
    const org1People = await core.listPeople("org1");
    expect(org1People).toHaveLength(1);
    expect(org1People[0]!.data.name).toBe("Ana");
  });

  it("upsertFromDpSync cria na primeira vez e atualiza na segunda, pelo externalId", async () => {
    const core = new CoreService(new MemoryEntityStore());
    const first = await core.upsertFromDpSync("org1", "ext-42", { name: "Carlos", email: "carlos@x.com", status: "active" });
    const second = await core.upsertFromDpSync("org1", "ext-42", { name: "Carlos Silva", email: "carlos@x.com", status: "active" });
    expect(second.id).toBe(first.id);
    expect(second.data.name).toBe("Carlos Silva");
    expect(second.data.source).toBe("dp_sync");
    const all = await core.listPeople("org1");
    expect(all).toHaveLength(1);
  });

  it("orgChart monta árvore a partir de managerId, com múltiplas raízes permitidas", async () => {
    const core = new CoreService(new MemoryEntityStore());
    const ceo = await core.createPerson("org1", { name: "CEO", email: "ceo@x.com", status: "active", source: "manual" });
    const vp = await core.createPerson("org1", { name: "VP", email: "vp@x.com", status: "active", source: "manual", managerId: ceo.id });
    await core.createPerson("org1", { name: "IC", email: "ic@x.com", status: "active", source: "manual", managerId: vp.id });
    await core.createPerson("org1", { name: "Consultor solto", email: "solto@x.com", status: "active", source: "manual" });

    const chart = await core.orgChart("org1");
    expect(chart).toHaveLength(2); // CEO e o consultor solto, ambos sem manager
    const ceoNode = chart.find((n) => n.person.data.name === "CEO")!;
    expect(ceoNode.reports).toHaveLength(1);
    expect(ceoNode.reports[0]!.person.data.name).toBe("VP");
    expect(ceoNode.reports[0]!.reports[0]!.person.data.name).toBe("IC");
  });

  it("competencyMatrix agrupa vínculos de competência por cargo", async () => {
    const core = new CoreService(new MemoryEntityStore());
    const role = await core.createJobRole("org1", { name: "Engenheiro" });
    const comp = await core.createCompetency("org1", { name: "Comunicação" });
    await core.linkRoleCompetency("org1", { roleId: role.id, competencyId: comp.id, targetLevel: 3 });
    const matrix = await core.competencyMatrix("org1");
    expect(matrix[role.id]).toHaveLength(1);
    expect(matrix[role.id]![0]!.data.targetLevel).toBe(3);
  });
});
