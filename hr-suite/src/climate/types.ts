export type SurveyType = "clima" | "enps" | "psicossocial";
export type SurveyStatus = "draft" | "open" | "closed";

export interface Survey {
  type: SurveyType;
  title: string;
  /** limiar mínimo de respostas para um recorte poder ser mostrado agregado
   *  — abaixo disso, o recorte simplesmente não aparece em lugar nenhum,
   *  nem para admin. Default 5, configurável só para cima, nunca para
   *  baixo (ver climate/aggregate.ts). */
  anonymityThreshold: number;
  startDate: string;
  endDate?: string;
  status: SurveyStatus;
}

/** Uma resposta de pesquisa NUNCA carrega personId — ver db/schema.sql,
 *  tabela hr.survey_responses. `segment` é opcional e só serve para corte
 *  agregado (ex.: "departamento:engenharia"), nunca para identificar. */
export interface SurveyResponseInput {
  surveyId: string;
  segment?: string;
  answers: Record<string, number>; // itemId -> valor da resposta
}

export const CLIMATE_ENTITY_TYPES = {
  survey: "survey",
  actionPlan: "action_plan",
} as const;

export type ActionPlanStatus = "planned" | "in_progress" | "done";

export interface ActionPlan {
  surveyId: string;
  /** categoria de risco psicossocial ou "geral" para clima/eNPS */
  riskCategory: string;
  action: string;
  responsiblePersonId?: string;
  deadline?: string;
  status: ActionPlanStatus;
  evidenceUrls?: string[];
  createdAt: string;
}
