import { describe, expect, it } from "vitest";
import { averageTimeToHireDays, costPerHire, funnelConversion, headcountOverTime, turnoverRate } from "../src/analytics/queries.js";
import type { Entity } from "../src/store/entity.js";
import type { Person } from "../src/core/types.js";
import type { Application } from "../src/ats/types.js";

function person(overrides: Partial<Person> & { hireDate: string }): Entity<Person> {
  return {
    id: crypto.randomUUID(),
    orgId: "org1",
    type: "person",
    createdAt: overrides.hireDate,
    updatedAt: overrides.hireDate,
    data: { name: "X", email: "x@x.com", status: "active", source: "manual", ...overrides },
  };
}

describe("headcountOverTime", () => {
  it("conta como ativo quem foi contratado até o fim do mês e não foi desligado antes dele", () => {
    const people = [
      person({ hireDate: "2026-01-15" }),
      person({ hireDate: "2026-03-10" }),
      person({ hireDate: "2026-01-01", terminatedAt: "2026-02-20", status: "inactive" }),
    ];
    const points = headcountOverTime(people, new Date("2026-04-15"), 4); // jan, fev, mar, abr
    expect(points.map((p) => p.month)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"]);
    expect(points[0]!.activeCount).toBe(2); // pessoa 1 e a que seria desligada depois
    expect(points[1]!.activeCount).toBe(1); // a desligada em 20/fev já não conta no fim de fevereiro
    expect(points[2]!.activeCount).toBe(2); // pessoa 2 contratada em março entra
    expect(points[3]!.activeCount).toBe(2);
  });
});

describe("turnoverRate", () => {
  it("calcula desligamentos no período sobre o headcount médio", () => {
    const people = [
      person({ hireDate: "2025-01-01" }),
      person({ hireDate: "2025-01-01" }),
      person({ hireDate: "2025-01-01", terminatedAt: "2026-06-15", status: "inactive" }),
      person({ hireDate: "2025-01-01", terminatedAt: "2026-06-20", status: "inactive" }),
    ];
    const rate = turnoverRate(people, new Date("2026-06-01"), new Date("2026-06-30"));
    // 4 ativos no início do período, 2 ativos no fim -> média 3; 2 desligamentos no período -> 2/3
    expect(rate).toBeCloseTo(2 / 3, 5);
  });

  it("não divide por zero quando não há ninguém ativo no período", () => {
    expect(turnoverRate([], new Date("2026-01-01"), new Date("2026-01-31"))).toBe(0);
  });
});

describe("funnelConversion", () => {
  it("acumula contagens de estágios posteriores e calcula conversão desde applied", () => {
    const counts = { applied: 10, screening: 4, interview: 3, offer: 2, hired: 1, rejected: 9 };
    const funnel = funnelConversion(counts);
    const byStage = Object.fromEntries(funnel.map((f) => [f.stage, f]));
    expect(byStage.applied!.count).toBe(10 + 4 + 3 + 2 + 1); // todo mundo que já passou por applied ou além
    expect(byStage.hired!.count).toBe(1);
    expect(byStage.hired!.conversionFromStart).toBeCloseTo(1 / 20, 5);
  });
});

function applicationWithDates(appliedAt: string, hiredAt?: string): Entity<Application> {
  const history: Application["history"] = [{ from: "applied", to: "applied", at: appliedAt }];
  if (hiredAt) history.push({ from: "offer", to: "hired", at: hiredAt });
  return {
    id: crypto.randomUUID(),
    orgId: "org1",
    type: "application",
    createdAt: appliedAt,
    updatedAt: hiredAt ?? appliedAt,
    data: { candidateId: "c1", postingId: "p1", stage: hiredAt ? "hired" : "applied", history, createdAt: appliedAt },
  };
}

describe("averageTimeToHireDays", () => {
  it("calcula a média de dias entre applied e hired, ignorando quem ainda não foi contratado", () => {
    const apps = [
      applicationWithDates("2026-01-01T00:00:00Z", "2026-01-11T00:00:00Z"), // 10 dias
      applicationWithDates("2026-02-01T00:00:00Z", "2026-02-21T00:00:00Z"), // 20 dias
      applicationWithDates("2026-03-01T00:00:00Z"), // não contratado, ignora
    ];
    expect(averageTimeToHireDays(apps)).toBe(15);
  });

  it("retorna undefined quando ninguém foi contratado ainda", () => {
    expect(averageTimeToHireDays([applicationWithDates("2026-01-01T00:00:00Z")])).toBeUndefined();
  });
});

describe("costPerHire", () => {
  it("divide o gasto total pelo número de contratações", () => {
    expect(costPerHire(50000, 10)).toBe(5000);
  });

  it("retorna undefined quando não houve contratação (divisão por zero evitada)", () => {
    expect(costPerHire(50000, 0)).toBeUndefined();
  });
});
