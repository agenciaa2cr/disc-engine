import type { Entity } from "../store/entity.js";
import type { Application, PipelineStage } from "../ats/types.js";
import type { Person } from "../core/types.js";

/**
 * People analytics — funções puras sobre dado já carregado (Entity[]),
 * não consultas SQL de agregação. Nesta fase o volume de dados de uma
 * organização (centenas a poucos milhares de pessoas) não justifica
 * empurrar isso para o banco; quando justificar, a assinatura da função
 * muda para receber já o agregado, não a lógica de cálculo.
 */

export interface HeadcountPoint {
  month: string; // "2026-01"
  activeCount: number;
}

/** Headcount ativo ao FINAL de cada mês, olhando para trás `months` meses
 *  a partir de `asOf`. Uma pessoa conta como ativa no mês M se foi
 *  contratada até o fim de M e (ainda ativa OU desligada depois do fim de M). */
export function headcountOverTime(people: readonly Entity<Person>[], asOf: Date, months: number): HeadcountPoint[] {
  const points: HeadcountPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthEnd = new Date(asOf.getFullYear(), asOf.getMonth() - i + 1, 0, 23, 59, 59);
    const label = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, "0")}`;
    const activeCount = people.filter((p) => {
      const hired = p.data.hireDate ? new Date(p.data.hireDate) : new Date(p.createdAt);
      if (hired > monthEnd) return false;
      if (p.data.terminatedAt && new Date(p.data.terminatedAt) <= monthEnd) return false;
      return true;
    }).length;
    points.push({ month: label, activeCount });
  }
  return points;
}

/** Turnover no período = desligamentos no período / headcount médio no período. */
export function turnoverRate(people: readonly Entity<Person>[], periodStart: Date, periodEnd: Date): number {
  const terminationsInPeriod = people.filter((p) => {
    if (!p.data.terminatedAt) return false;
    const t = new Date(p.data.terminatedAt);
    return t >= periodStart && t <= periodEnd;
  }).length;

  const activeAtStart = people.filter((p) => {
    const hired = p.data.hireDate ? new Date(p.data.hireDate) : new Date(p.createdAt);
    if (hired > periodStart) return false;
    return !p.data.terminatedAt || new Date(p.data.terminatedAt) > periodStart;
  }).length;
  const activeAtEnd = people.filter((p) => {
    const hired = p.data.hireDate ? new Date(p.data.hireDate) : new Date(p.createdAt);
    if (hired > periodEnd) return false;
    return !p.data.terminatedAt || new Date(p.data.terminatedAt) > periodEnd;
  }).length;

  const avgHeadcount = (activeAtStart + activeAtEnd) / 2;
  if (avgHeadcount === 0) return 0;
  return terminationsInPeriod / avgHeadcount;
}

export interface FunnelConversion {
  stage: PipelineStage;
  count: number;
  /** conversão acumulada desde "applied" — 1.0 no próprio "applied" */
  conversionFromStart: number;
}

const FORWARD_STAGES: PipelineStage[] = ["applied", "screening", "interview", "offer", "hired"];

export function funnelConversion(counts: Record<PipelineStage, number>): FunnelConversion[] {
  // conta candidatos que JÁ PASSARAM por cada estágio, não só os parados
  // nele agora — soma todo estágio igual ou posterior na ordem canônica.
  // "applied" acumulado é, por construção, o total de candidaturas que já
  // entraram no funil (independente de onde estão agora) — é ESSE número,
  // não o count bruto de quem está parado no estágio "applied" neste
  // instante, que serve de denominador para a taxa de conversão.
  let cumulative = 0;
  const totals: Record<string, number> = {};
  for (let i = FORWARD_STAGES.length - 1; i >= 0; i--) {
    const stage = FORWARD_STAGES[i]!;
    cumulative += counts[stage] ?? 0;
    totals[stage] = cumulative;
  }
  const startCount = totals.applied || 1;
  return FORWARD_STAGES.map((stage) => ({ stage, count: totals[stage] ?? 0, conversionFromStart: (totals[stage] ?? 0) / startCount }));
}

/** Tempo médio, em dias, de "applied" até a transição para "hired". */
export function averageTimeToHireDays(applications: readonly Entity<Application>[]): number | undefined {
  const durations: number[] = [];
  for (const app of applications) {
    const applied = app.data.history.find((h) => h.to === "applied");
    const hired = app.data.history.find((h) => h.to === "hired");
    if (!applied || !hired) continue;
    const days = (new Date(hired.at).getTime() - new Date(applied.at).getTime()) / (1000 * 60 * 60 * 24);
    durations.push(days);
  }
  if (durations.length === 0) return undefined;
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

/** Custo por contratação — recebe o gasto total do período de fora, porque
 *  esta suíte não tem módulo financeiro nem integra com nota fiscal/folha.
 *  Não finja precisão que o sistema não tem dado para sustentar. */
export function costPerHire(totalSpend: number, hiresCount: number): number | undefined {
  if (hiresCount === 0) return undefined;
  return totalSpend / hiresCount;
}
