import type { Entity, EntityStore } from "../store/entity.js";
import {
  DEFAULT_ONBOARDING_TEMPLATE,
  TRAINING_ENTITY_TYPES,
  type Course,
  type Enrollment,
  type OffboardingInterview,
  type OnboardingChecklist,
  type SuccessionPlan,
} from "./types.js";

export class TrainingService {
  constructor(private store: EntityStore) {}

  // --- Catálogo e matrículas --------------------------------------------------
  async createCourse(orgId: string, course: Course): Promise<Entity<Course>> {
    return this.store.create(orgId, TRAINING_ENTITY_TYPES.course, course);
  }

  async listCourses(orgId: string): Promise<Entity<Course>[]> {
    return this.store.list<Course>({ orgId, type: TRAINING_ENTITY_TYPES.course });
  }

  async enroll(orgId: string, personId: string, courseId: string): Promise<Entity<Enrollment>> {
    return this.store.create(orgId, TRAINING_ENTITY_TYPES.enrollment, { personId, courseId, status: "enrolled" } satisfies Enrollment);
  }

  async completeEnrollment(id: string, certificateUrl?: string): Promise<Entity<Enrollment> | undefined> {
    return this.store.update<Enrollment>(id, { status: "completed", completedAt: new Date().toISOString(), certificateUrl });
  }

  async listEnrollmentsForPerson(orgId: string, personId: string): Promise<Entity<Enrollment>[]> {
    return this.store.list<Enrollment>({ orgId, type: TRAINING_ENTITY_TYPES.enrollment, where: { personId } });
  }

  // --- Onboarding ----------------------------------------------------------------
  async startOnboarding(orgId: string, personId: string, buddyPersonId?: string): Promise<Entity<OnboardingChecklist>> {
    const items = DEFAULT_ONBOARDING_TEMPLATE.map((i) => ({ ...i, done: false }));
    return this.store.create(orgId, TRAINING_ENTITY_TYPES.onboardingChecklist, { personId, buddyPersonId, items } satisfies OnboardingChecklist);
  }

  async completeOnboardingItem(checklistId: string, itemIndex: number): Promise<Entity<OnboardingChecklist> | undefined> {
    const checklist = await this.store.get<OnboardingChecklist>(checklistId);
    if (!checklist) return undefined;
    const items = checklist.data.items.map((it, i) => (i === itemIndex ? { ...it, done: true, doneAt: new Date().toISOString() } : it));
    return this.store.update<OnboardingChecklist>(checklistId, { items });
  }

  async onboardingProgress(checklistId: string): Promise<number | undefined> {
    const checklist = await this.store.get<OnboardingChecklist>(checklistId);
    if (!checklist) return undefined;
    const total = checklist.data.items.length;
    if (total === 0) return 1;
    return checklist.data.items.filter((i) => i.done).length / total;
  }

  // --- Sucessão --------------------------------------------------------------------
  async createSuccessionPlan(orgId: string, plan: SuccessionPlan): Promise<Entity<SuccessionPlan>> {
    return this.store.create(orgId, TRAINING_ENTITY_TYPES.successionPlan, plan);
  }

  async listSuccessionForRole(orgId: string, roleId: string): Promise<Entity<SuccessionPlan>[]> {
    return this.store.list<SuccessionPlan>({ orgId, type: TRAINING_ENTITY_TYPES.successionPlan, where: { roleId } });
  }

  /** "Força de banco" por cargo: quantos candidatos prontos agora, e se o
   *  cargo tem risco alto de perda do titular sem sucessor pronto — o par
   *  de números que uma diretoria realmente quer ver numa reunião. */
  async benchStrength(orgId: string, roleId: string): Promise<{ readyNow: number; total: number; incumbentHighRiskNoSuccessor: boolean }> {
    const plans = await this.listSuccessionForRole(orgId, roleId);
    const readyNow = plans.filter((p) => p.data.readiness === "ready_now").length;
    const incumbentHighRiskNoSuccessor = plans.some((p) => p.data.incumbentLossRisk === "alto") && readyNow === 0;
    return { readyNow, total: plans.length, incumbentHighRiskNoSuccessor };
  }

  // --- Offboarding -----------------------------------------------------------------
  async recordOffboardingInterview(orgId: string, interview: OffboardingInterview): Promise<Entity<OffboardingInterview>> {
    return this.store.create(orgId, TRAINING_ENTITY_TYPES.offboardingInterview, interview);
  }

  async listOffboardingInterviews(orgId: string): Promise<Entity<OffboardingInterview>[]> {
    return this.store.list<OffboardingInterview>({ orgId, type: TRAINING_ENTITY_TYPES.offboardingInterview });
  }
}
