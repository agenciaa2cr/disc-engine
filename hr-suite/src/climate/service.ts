import type { Entity, EntityStore } from "../store/entity.js";
import { computeDomainRiskScores, computeEnps, type DomainRiskResult, type EnpsResult } from "./aggregate.js";
import { PSYCHOSOCIAL_ITEMS } from "./psychosocial-questionnaire.js";
import { createSurveyResponseStore, type SurveyResponseStore } from "./response-store.js";
import { CLIMATE_ENTITY_TYPES, type ActionPlan, type ActionPlanStatus, type Survey, type SurveyResponseInput, type SurveyType } from "./types.js";

export class SurveyError extends Error {}

const VALID_ITEM_IDS = new Set(PSYCHOSOCIAL_ITEMS.map((i) => i.id));

export class ClimateService {
  private responses: SurveyResponseStore;

  constructor(private store: EntityStore, responseStore?: SurveyResponseStore) {
    this.responses = responseStore ?? createSurveyResponseStore();
  }

  async createSurvey(orgId: string, input: Omit<Survey, "status">): Promise<Entity<Survey>> {
    return this.store.create(orgId, CLIMATE_ENTITY_TYPES.survey, { ...input, status: "draft" } satisfies Survey);
  }

  async openSurvey(id: string): Promise<Entity<Survey> | undefined> {
    return this.store.update<Survey>(id, { status: "open" });
  }

  async closeSurvey(id: string): Promise<Entity<Survey> | undefined> {
    return this.store.update<Survey>(id, { status: "closed" });
  }

  async listSurveys(orgId: string, type?: SurveyType): Promise<Entity<Survey>[]> {
    return this.store.list<Survey>({ orgId, type: CLIMATE_ENTITY_TYPES.survey, where: type ? { type } : undefined });
  }

  async submitResponse(orgId: string, input: SurveyResponseInput): Promise<void> {
    const survey = await this.store.get<Survey>(input.surveyId);
    if (!survey || survey.orgId !== orgId) throw new SurveyError(`pesquisa ${input.surveyId} não encontrada`);
    if (survey.data.status !== "open") throw new SurveyError("pesquisa não está aberta para resposta");

    if (survey.data.type === "psicossocial") {
      for (const itemId of Object.keys(input.answers)) {
        if (!VALID_ITEM_IDS.has(itemId)) throw new SurveyError(`item desconhecido no questionário psicossocial: ${itemId}`);
      }
    }
    if (survey.data.type === "enps") {
      const score = input.answers["score"];
      if (typeof score !== "number" || score < 0 || score > 10) throw new SurveyError("eNPS exige answers.score entre 0 e 10");
    }

    await this.responses.submit(orgId, input);
  }

  /** undefined = ainda não há respostas suficientes para preservar
   *  anonimato (ver climate/aggregate.ts) — a UI deve tratar isso como
   *  "aguardando mais respostas", nunca inventar um número. */
  async psychosocialRiskReport(orgId: string, surveyId: string): Promise<DomainRiskResult[] | undefined> {
    const survey = await this.store.get<Survey>(surveyId);
    if (!survey) throw new SurveyError(`pesquisa ${surveyId} não encontrada`);
    const responses = await this.responses.listForSurvey(orgId, surveyId);
    return computeDomainRiskScores(responses, survey.data.anonymityThreshold);
  }

  async enpsReport(orgId: string, surveyId: string): Promise<EnpsResult | undefined> {
    const survey = await this.store.get<Survey>(surveyId);
    if (!survey) throw new SurveyError(`pesquisa ${surveyId} não encontrada`);
    const responses = await this.responses.listForSurvey(orgId, surveyId);
    const scores = responses.map((r) => r.answers["score"]).filter((s): s is number => typeof s === "number");
    return computeEnps(scores, survey.data.anonymityThreshold);
  }

  // --- Planos de ação (o que o PGR/NR-01 exige como evidência de gestão) --------
  async createActionPlan(orgId: string, plan: Omit<ActionPlan, "status" | "createdAt">): Promise<Entity<ActionPlan>> {
    return this.store.create(orgId, CLIMATE_ENTITY_TYPES.actionPlan, {
      ...plan,
      status: "planned",
      createdAt: new Date().toISOString(),
    } satisfies ActionPlan);
  }

  async updateActionPlanStatus(id: string, status: ActionPlanStatus): Promise<Entity<ActionPlan> | undefined> {
    return this.store.update<ActionPlan>(id, { status });
  }

  async listActionPlans(orgId: string, surveyId?: string): Promise<Entity<ActionPlan>[]> {
    return this.store.list<ActionPlan>({ orgId, type: CLIMATE_ENTITY_TYPES.actionPlan, where: surveyId ? { surveyId } : undefined });
  }
}
