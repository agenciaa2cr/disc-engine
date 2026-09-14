export interface Course {
  title: string;
  description?: string;
  durationHours?: number;
  category?: string;
}

export type EnrollmentStatus = "enrolled" | "in_progress" | "completed";

export interface Enrollment {
  personId: string;
  courseId: string;
  status: EnrollmentStatus;
  completedAt?: string;
  certificateUrl?: string;
}

export interface OnboardingItem {
  day: 30 | 60 | 90;
  description: string;
  done: boolean;
  doneAt?: string;
}

export interface OnboardingChecklist {
  personId: string;
  buddyPersonId?: string;
  items: OnboardingItem[];
}

export type Readiness = "ready_now" | "ready_1_2y" | "ready_3plus" | "developing";
export type LossRisk = "baixo" | "medio" | "alto";

export interface SuccessionPlan {
  roleId: string;
  incumbentPersonId?: string;
  incumbentLossRisk?: LossRisk;
  candidatePersonId: string;
  readiness: Readiness;
  notes?: string;
}

export interface OffboardingInterview {
  personId: string;
  exitDate: string;
  reasonCategory: string;
  structuredAnswers: Record<string, string>;
  wouldRecommendCompany: boolean;
  rehireEligible: boolean;
}

export const TRAINING_ENTITY_TYPES = {
  course: "course",
  enrollment: "enrollment",
  onboardingChecklist: "onboarding_checklist",
  successionPlan: "succession_plan",
  offboardingInterview: "offboarding_interview",
} as const;

/** Template padrão de 30/60/90 dias — usado para gerar o checklist na
 *  contratação; cada organização pode customizar depois editando os itens. */
export const DEFAULT_ONBOARDING_TEMPLATE: readonly Omit<OnboardingItem, "done" | "doneAt">[] = [
  { day: 30, description: "Concluir trilha de integração e ferramentas de acesso" },
  { day: 30, description: "Reunião 1:1 de boas-vindas com o gestor direto" },
  { day: 30, description: "Apresentação ao time e aos principais stakeholders" },
  { day: 60, description: "Primeira entrega relevante concluída e revisada" },
  { day: 60, description: "Check-in de clima e adaptação com o RH" },
  { day: 90, description: "Avaliação formal de período de experiência" },
  { day: 90, description: "Definição das primeiras metas do ciclo de desempenho" },
];
