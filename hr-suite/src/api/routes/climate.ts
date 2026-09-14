import type { Router } from "../router.js";
import type { Services } from "../services.js";
import { readJsonBody, sendJson } from "../http.js";
import { SurveyError } from "../../climate/service.js";
import type { ActionPlan, ActionPlanStatus, Survey, SurveyResponseInput } from "../../climate/types.js";
import { PSYCHOSOCIAL_ITEMS, PSYCHOSOCIAL_DOMAIN_LABELS, RESPONSE_SCALE } from "../../climate/psychosocial-questionnaire.js";

export function registerClimateRoutes(router: Router, services: Services): void {
  const { climate } = services;

  // Estrutura do questionário psicossocial — público, sem orgId: é o
  // mesmo instrumento para todas as organizações (ver o aviso de uso em
  // src/climate/psychosocial-questionnaire.ts).
  router.get("/psychosocial-questionnaire", async ({ res }) => {
    sendJson(res, 200, { items: PSYCHOSOCIAL_ITEMS, domainLabels: PSYCHOSOCIAL_DOMAIN_LABELS, scale: RESPONSE_SCALE });
  });

  router.post("/orgs/:orgId/surveys", async ({ req, res, params }) => {
    const body = await readJsonBody<Omit<Survey, "status" | "anonymityThreshold"> & { anonymityThreshold?: number }>(req);
    const survey = { ...body, anonymityThreshold: body.anonymityThreshold ?? 5 };
    sendJson(res, 201, await climate.createSurvey(params.orgId!, survey));
  });

  router.post("/surveys/:id/open", async ({ res, params }) => {
    const survey = await climate.openSurvey(params.id!);
    if (!survey) return sendJson(res, 404, { error: "pesquisa não encontrada" });
    sendJson(res, 200, survey);
  });

  router.post("/surveys/:id/close", async ({ res, params }) => {
    const survey = await climate.closeSurvey(params.id!);
    if (!survey) return sendJson(res, 404, { error: "pesquisa não encontrada" });
    sendJson(res, 200, survey);
  });

  router.get("/orgs/:orgId/surveys", async ({ res, params, url }) => {
    const type = url.searchParams.get("type") as Survey["type"] | null;
    sendJson(res, 200, await climate.listSurveys(params.orgId!, type ?? undefined));
  });

  // Resposta pública — sem identificação de pessoa no corpo. `segment` é
  // opcional e serve só para corte agregado (ver aggregate.ts).
  router.post("/orgs/:orgId/survey-responses", async ({ req, res, params }) => {
    const body = await readJsonBody<SurveyResponseInput>(req);
    try {
      await climate.submitResponse(params.orgId!, body);
      sendJson(res, 201, { ok: true });
    } catch (err) {
      if (err instanceof SurveyError) return sendJson(res, 400, { error: err.message });
      throw err;
    }
  });

  router.get("/orgs/:orgId/surveys/:id/psychosocial-report", async ({ res, params }) => {
    try {
      const report = await climate.psychosocialRiskReport(params.orgId!, params.id!);
      if (!report) return sendJson(res, 202, { pending: true, reason: "respostas insuficientes para preservar anonimato" });
      sendJson(res, 200, report);
    } catch (err) {
      if (err instanceof SurveyError) return sendJson(res, 404, { error: err.message });
      throw err;
    }
  });

  router.get("/orgs/:orgId/surveys/:id/enps-report", async ({ res, params }) => {
    try {
      const report = await climate.enpsReport(params.orgId!, params.id!);
      if (!report) return sendJson(res, 202, { pending: true, reason: "respostas insuficientes para preservar anonimato" });
      sendJson(res, 200, report);
    } catch (err) {
      if (err instanceof SurveyError) return sendJson(res, 404, { error: err.message });
      throw err;
    }
  });

  router.post("/orgs/:orgId/action-plans", async ({ req, res, params }) => {
    const body = await readJsonBody<Omit<ActionPlan, "status" | "createdAt">>(req);
    sendJson(res, 201, await climate.createActionPlan(params.orgId!, body));
  });

  router.post("/action-plans/:id/status", async ({ req, res, params }) => {
    const body = await readJsonBody<{ status: ActionPlanStatus }>(req);
    const plan = await climate.updateActionPlanStatus(params.id!, body.status);
    if (!plan) return sendJson(res, 404, { error: "plano de ação não encontrado" });
    sendJson(res, 200, plan);
  });

  router.get("/orgs/:orgId/action-plans", async ({ res, params, url }) => {
    const surveyId = url.searchParams.get("surveyId") ?? undefined;
    sendJson(res, 200, await climate.listActionPlans(params.orgId!, surveyId));
  });
}
