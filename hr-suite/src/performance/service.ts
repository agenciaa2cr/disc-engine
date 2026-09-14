import type { Entity, EntityStore } from "../store/entity.js";
import { boxLabel, boxNumber } from "./nine-box.js";
import {
  PERFORMANCE_ENTITY_TYPES,
  type CheckIn,
  type Feedback,
  type FeedbackVisibility,
  type Goal,
  type NineBoxLevel,
  type NineBoxPlacement,
  type OneOnOne,
  type Pdi,
  type ReviewAssignment,
  type ReviewCycle,
  type ReviewerRelationship,
} from "./types.js";

export class GoalError extends Error {}

export class PerformanceService {
  constructor(private store: EntityStore) {}

  // --- Metas / OKRs -----------------------------------------------------------
  async createGoal(orgId: string, goal: Omit<Goal, "status">): Promise<Entity<Goal>> {
    if (goal.type === "key_result") {
      if (!goal.parentId) throw new GoalError("key_result precisa de parentId (o objective ao qual pertence)");
      const parent = await this.store.get<Goal>(goal.parentId);
      if (!parent || parent.orgId !== orgId) throw new GoalError(`objective pai ${goal.parentId} não encontrado nesta organização`);
      if (parent.data.type !== "objective") throw new GoalError("parentId precisa apontar para um goal do tipo objective");
    }
    return this.store.create(orgId, PERFORMANCE_ENTITY_TYPES.goal, { ...goal, status: "on_track" } satisfies Goal);
  }

  async checkIn(goalId: string, progressValue: number, opts: { note?: string; by?: string; date?: string } = {}): Promise<{ goal: Entity<Goal>; checkIn: Entity<CheckIn> }> {
    const goal = await this.store.get<Goal>(goalId);
    if (!goal) throw new GoalError(`goal ${goalId} não encontrado`);

    const status = deriveStatus(progressValue, goal.data.targetValue);
    const updatedGoal = await this.store.update<Goal>(goalId, { currentValue: progressValue, status });

    const checkIn = await this.store.create<CheckIn>(goal.orgId, PERFORMANCE_ENTITY_TYPES.checkIn, {
      goalId,
      date: opts.date ?? new Date().toISOString(),
      note: opts.note,
      progressValue,
      by: opts.by,
    });

    return { goal: updatedGoal!, checkIn };
  }

  async listGoalsForOwner(orgId: string, ownerId: string): Promise<Entity<Goal>[]> {
    return this.store.list<Goal>({ orgId, type: PERFORMANCE_ENTITY_TYPES.goal, where: { ownerId } });
  }

  async listKeyResults(orgId: string, objectiveId: string): Promise<Entity<Goal>[]> {
    return this.store.list<Goal>({ orgId, type: PERFORMANCE_ENTITY_TYPES.goal, where: { parentId: objectiveId } });
  }

  /** Progresso de um objective = média do progresso (currentValue/targetValue,
   *  0–1) dos seus key results. Sem key result, usa o próprio progresso do
   *  objective — permite objective "solto" enquanto o cascateamento não foi
   *  todo desenhado. */
  async objectiveProgress(orgId: string, objectiveId: string): Promise<number> {
    const krs = await this.listKeyResults(orgId, objectiveId);
    if (krs.length === 0) {
      const objective = await this.store.get<Goal>(objectiveId);
      return objective ? progressRatio(objective.data.currentValue, objective.data.targetValue) : 0;
    }
    const ratios = krs.map((kr) => progressRatio(kr.data.currentValue, kr.data.targetValue));
    return ratios.reduce((a, b) => a + b, 0) / ratios.length;
  }

  // --- 1:1s ---------------------------------------------------------------------
  async createOneOnOne(orgId: string, oneOnOne: OneOnOne): Promise<Entity<OneOnOne>> {
    return this.store.create(orgId, PERFORMANCE_ENTITY_TYPES.oneOnOne, oneOnOne);
  }

  async listOneOnOnesForPerson(orgId: string, personId: string): Promise<Entity<OneOnOne>[]> {
    return this.store.list<OneOnOne>({ orgId, type: PERFORMANCE_ENTITY_TYPES.oneOnOne, where: { personId } });
  }

  // --- Feedback ------------------------------------------------------------------
  async giveFeedback(orgId: string, feedback: Omit<Feedback, "createdAt">): Promise<Entity<Feedback>> {
    return this.store.create(orgId, PERFORMANCE_ENTITY_TYPES.feedback, { ...feedback, createdAt: new Date().toISOString() });
  }

  /** `viewerId` só recebe feedback "public", "manager" (se for gestor de
   *  toPersonId — checagem fica a cargo de quem chama, este método não
   *  resolve hierarquia sozinho) ou qualquer visibilidade se for o próprio
   *  destinatário. É um filtro deliberadamente simples — RBAC de verdade é
   *  trabalho de Fase 2 de produto, não deste módulo de domínio. */
  async listFeedbackFor(orgId: string, toPersonId: string, viewerId: string, viewerIsManager: boolean): Promise<Entity<Feedback>[]> {
    const all = await this.store.list<Feedback>({ orgId, type: PERFORMANCE_ENTITY_TYPES.feedback, where: { toPersonId } });
    return all.filter((f) => {
      const vis: FeedbackVisibility = f.data.visibility;
      if (vis === "public") return true;
      if (viewerId === toPersonId) return true;
      if (vis === "manager" && viewerIsManager) return true;
      return false;
    });
  }

  // --- PDI ---------------------------------------------------------------------
  async createPdi(orgId: string, pdi: Omit<Pdi, "status">): Promise<Entity<Pdi>> {
    return this.store.create(orgId, PERFORMANCE_ENTITY_TYPES.pdi, { ...pdi, status: "open" } satisfies Pdi);
  }

  async updatePdiAction(pdiId: string, actionIndex: number, status: "pending" | "in_progress" | "done"): Promise<Entity<Pdi> | undefined> {
    const pdi = await this.store.get<Pdi>(pdiId);
    if (!pdi) return undefined;
    const actions = pdi.data.actions.map((a, i) => (i === actionIndex ? { ...a, status } : a));
    const allDone = actions.every((a) => a.status === "done");
    return this.store.update<Pdi>(pdiId, { actions, status: allDone ? "closed" : "open" });
  }

  async listPdiForPerson(orgId: string, personId: string): Promise<Entity<Pdi>[]> {
    return this.store.list<Pdi>({ orgId, type: PERFORMANCE_ENTITY_TYPES.pdi, where: { personId } });
  }

  // --- Ciclos de avaliação -------------------------------------------------------
  async createReviewCycle(orgId: string, cycle: Omit<ReviewCycle, "status">): Promise<Entity<ReviewCycle>> {
    return this.store.create(orgId, PERFORMANCE_ENTITY_TYPES.reviewCycle, { ...cycle, status: "draft" } satisfies ReviewCycle);
  }

  async openReviewCycle(id: string): Promise<Entity<ReviewCycle> | undefined> {
    return this.store.update<ReviewCycle>(id, { status: "open" });
  }

  async assignReviewer(orgId: string, cycleId: string, subjectPersonId: string, reviewerPersonId: string, relationship: ReviewerRelationship): Promise<Entity<ReviewAssignment>> {
    return this.store.create(orgId, PERFORMANCE_ENTITY_TYPES.reviewAssignment, {
      cycleId,
      subjectPersonId,
      reviewerPersonId,
      relationship,
      status: "pending",
      ratings: [],
    } satisfies ReviewAssignment);
  }

  async submitReview(assignmentId: string, ratings: ReviewAssignment["ratings"], overallComment?: string): Promise<Entity<ReviewAssignment> | undefined> {
    return this.store.update<ReviewAssignment>(assignmentId, { status: "submitted", ratings, overallComment, submittedAt: new Date().toISOString() });
  }

  async listAssignmentsForCycle(orgId: string, cycleId: string): Promise<Entity<ReviewAssignment>[]> {
    return this.store.list<ReviewAssignment>({ orgId, type: PERFORMANCE_ENTITY_TYPES.reviewAssignment, where: { cycleId } });
  }

  async listAssignmentsForSubject(orgId: string, cycleId: string, subjectPersonId: string): Promise<Entity<ReviewAssignment>[]> {
    const all = await this.listAssignmentsForCycle(orgId, cycleId);
    return all.filter((a) => a.data.subjectPersonId === subjectPersonId);
  }

  /** % de avaliações submetidas — o número que decide se o ciclo pode
   *  avançar para calibração. */
  async cycleCompletionRate(orgId: string, cycleId: string): Promise<number> {
    const assignments = await this.listAssignmentsForCycle(orgId, cycleId);
    if (assignments.length === 0) return 0;
    const submitted = assignments.filter((a) => a.data.status === "submitted").length;
    return submitted / assignments.length;
  }

  // --- 9-box -----------------------------------------------------------------------
  async placeNineBox(orgId: string, cycleId: string, personId: string, performanceLevel: NineBoxLevel, potentialLevel: NineBoxLevel, opts: { placedBy?: string; notes?: string } = {}) {
    const placement: NineBoxPlacement = {
      cycleId,
      personId,
      performanceLevel,
      potentialLevel,
      placedAt: new Date().toISOString(),
      placedBy: opts.placedBy,
      notes: opts.notes,
    };
    const entity = await this.store.create(orgId, PERFORMANCE_ENTITY_TYPES.nineBoxPlacement, placement);
    return { entity, box: boxNumber(performanceLevel, potentialLevel), label: boxLabel(performanceLevel, potentialLevel) };
  }

  async listNineBoxForCycle(orgId: string, cycleId: string): Promise<Entity<NineBoxPlacement>[]> {
    return this.store.list<NineBoxPlacement>({ orgId, type: PERFORMANCE_ENTITY_TYPES.nineBoxPlacement, where: { cycleId } });
  }
}

function progressRatio(current: number | undefined, target: number | undefined): number {
  if (!target || target === 0) return 0;
  return Math.max(0, Math.min(1.2, (current ?? 0) / target)); // permite até 120% de superação, mas não infinito
}

function deriveStatus(current: number, target: number | undefined): Goal["status"] {
  if (!target) return "on_track"; // sem meta numérica, sem como derivar — fica a cargo de atualização manual
  const ratio = current / target;
  if (ratio >= 1) return "done";
  if (ratio >= 0.9) return "on_track";
  if (ratio >= 0.6) return "at_risk";
  return "off_track";
}
