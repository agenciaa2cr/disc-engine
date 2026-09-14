// Demo executável ponta a ponta de toda a suíte — sem servidor HTTP, sem
// banco, sem rede. Roda os serviços de domínio diretamente sobre o
// armazenamento em memória, para mostrar como os módulos se encaixam.
import { MemoryEntityStore } from "../src/store/memory-store.js";
import { CoreService } from "../src/core/service.js";
import { AtsService } from "../src/ats/service.js";
import { PerformanceService } from "../src/performance/service.js";
import { ClimateService } from "../src/climate/service.js";
import { TrainingService } from "../src/training/service.js";
import { MemorySurveyResponseStore } from "../src/climate/response-store.js";
import { PSYCHOSOCIAL_ITEMS } from "../src/climate/psychosocial-questionnaire.js";
import { headcountOverTime, funnelConversion } from "../src/analytics/queries.js";

const ORG = "org-demo";

async function main() {
  const store = new MemoryEntityStore();
  const core = new CoreService(store);
  const ats = new AtsService(store);
  const performance = new PerformanceService(store);
  const climate = new ClimateService(store, new MemorySurveyResponseStore());
  const training = new TrainingService(store);

  console.log("\n=== 1. Core: cargos e liderança ===");
  const role = await core.createJobRole(ORG, { name: "Vendedor Sênior", family: "Comercial", level: "Sênior" });
  const comunicacao = await core.createCompetency(ORG, { name: "Comunicação", category: "Comportamental" });
  await core.linkRoleCompetency(ORG, { roleId: role.id, competencyId: comunicacao.id, targetLevel: 4 });
  const gestora = await core.createPerson(ORG, { name: "Marina (Gestora Comercial)", email: "marina@empresa.com", status: "active", source: "manual" });
  console.log(`Cargo "${role.data.name}" criado, com meta de nível 4 em Comunicação.`);

  console.log("\n=== 2. R&S: vaga → funil → contratação ===");
  const posting = await ats.createPosting(ORG, { title: "Vendedor Sênior", description: "Vaga para o time comercial.", roleId: role.id });
  await ats.publishPosting(posting.id);
  const candidate = await ats.createCandidate(ORG, { name: "Pedro Almeida", email: "pedro@email.com", source: "career_page" });
  let application = await ats.apply(ORG, candidate.id, posting.id);
  for (const stage of ["screening", "interview", "offer"] as const) {
    application = await ats.transitionStage(application.id, stage, { by: "recrutador@empresa.com" });
  }
  const { person: novoColaborador } = await ats.hire(ORG, application.id, "2026-09-15", { by: "recrutador@empresa.com" });
  await core.updatePerson(novoColaborador.id, { managerId: gestora.id });
  console.log(`${novoColaborador.data.name} contratado(a) em ${novoColaborador.data.hireDate}, reportando para ${gestora.data.name}.`);

  const funnelCounts = await ats.fitFunnelCounts(ORG, posting.id);
  console.log("Funil:", funnelConversion(funnelCounts).map((f) => `${f.stage}=${f.count}`).join(" · "));

  console.log("\n=== 3. Onboarding 30/60/90 ===");
  const onboarding = await training.startOnboarding(ORG, novoColaborador.id, gestora.id);
  await training.completeOnboardingItem(onboarding.id, 0);
  const progress = await training.onboardingProgress(onboarding.id);
  console.log(`Checklist com ${onboarding.data.items.length} itens — progresso: ${Math.round((progress ?? 0) * 100)}%`);

  console.log("\n=== 4. Desempenho: OKR cascateado e 9-box ===");
  const objective = await performance.createGoal(ORG, { ownerId: novoColaborador.id, title: "Crescer carteira de clientes", type: "objective", period: "2026-Q4" });
  const kr = await performance.createGoal(ORG, { ownerId: novoColaborador.id, title: "Fechar 15 contas novas", type: "key_result", parentId: objective.id, targetValue: 15, period: "2026-Q4" });
  await performance.checkIn(kr.id, 9, { note: "Fechamento do mês 1", by: novoColaborador.id });
  const objProgress = await performance.objectiveProgress(ORG, objective.id);
  console.log(`Objective "${objective.data.title}": ${Math.round(objProgress * 100)}% de progresso via key results.`);

  const cycle = await performance.createReviewCycle(ORG, { name: "2026 H2", periodStart: "2026-07-01", periodEnd: "2026-12-31", type: "180" });
  const { box, label } = await performance.placeNineBox(ORG, cycle.id, novoColaborador.id, 2, 3, { placedBy: gestora.id, notes: "Primeiro ciclo — ainda pouco histórico" });
  console.log(`Colocação 9-box: caixa ${box} — "${label}".`);

  console.log("\n=== 5. Clima e NR-01: pesquisa psicossocial com anonimato real ===");
  const survey = await climate.createSurvey(ORG, { type: "psicossocial", title: "Pulso Psicossocial Q4/2026", anonymityThreshold: 5, startDate: "2026-10-01" });
  await climate.openSurvey(survey.id);
  console.log(`Questionário com ${PSYCHOSOCIAL_ITEMS.length} itens em 7 domínios (inspirado no COPSOQ III).`);

  const pendingReport = await climate.psychosocialRiskReport(ORG, survey.id);
  console.log(`Com 0 respostas: relatório = ${pendingReport === undefined ? "indisponível (anonimato)" : "disponível"}`);

  // simula 5 respondentes do time comercial, com carga de trabalho alta e boa liderança
  for (let i = 0; i < 5; i++) {
    const answers: Record<string, number> = {};
    for (const item of PSYCHOSOCIAL_ITEMS) {
      if (item.domain === "exigencias_trabalho") answers[item.id] = 3; // exigência alta
      else if (item.domain === "relacoes_lideranca") answers[item.id] = 3; // boa liderança (item reversed)
      else answers[item.id] = 2;
    }
    await climate.submitResponse(ORG, { surveyId: survey.id, segment: "comercial", answers });
  }
  const report = await climate.psychosocialRiskReport(ORG, survey.id);
  console.log("Com 5 respostas, risco por domínio:");
  report?.forEach((r) => console.log(`  ${r.domain.padEnd(28)} score=${String(r.score).padStart(3)} banda=${r.band}${r.criticalExposureFlag ? " ⚠ exposição crítica relatada" : ""}`));

  const highRiskDomain = report?.find((r) => r.band === "alto");
  if (highRiskDomain) {
    const plan = await climate.createActionPlan(ORG, {
      surveyId: survey.id,
      riskCategory: highRiskDomain.domain,
      action: "Revisar distribuição de metas e volume de contas por vendedor(a)",
      responsiblePersonId: gestora.id,
      deadline: "2026-11-30",
    });
    console.log(`Plano de ação criado para "${highRiskDomain.domain}": status ${plan.data.status}.`);
  }

  console.log("\n=== 6. People analytics ===");
  const allPeople = [...(await core.listPeople(ORG)), ...(await core.listPeople(ORG, { status: "inactive" }))];
  const headcount = headcountOverTime(allPeople, new Date("2026-09-14"), 6);
  console.log("Headcount últimos 6 meses:", headcount.map((h) => `${h.month}=${h.activeCount}`).join(" · "));

  console.log("\n=== Fim da demo — tudo acima rodou em memória, sem rede, sem banco ===\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
