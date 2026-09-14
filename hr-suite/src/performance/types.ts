export type GoalType = "objective" | "key_result";
export type GoalStatus = "on_track" | "at_risk" | "off_track" | "done";

export interface Goal {
  ownerId: string; // person id (times ficam para uma versão futura com entidade "team")
  title: string;
  type: GoalType;
  parentId?: string; // obrigatório quando type === "key_result": o objective ao qual pertence
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  period: string; // ex.: "2026-Q3"
  status: GoalStatus;
}

export interface CheckIn {
  goalId: string;
  date: string;
  note?: string;
  progressValue: number; // novo currentValue do goal após este check-in
  by?: string;
}

export interface OneOnOne {
  personId: string;
  managerId: string;
  date: string;
  agenda: string[];
  notes?: string;
  actionItems: { description: string; done: boolean }[];
}

export type FeedbackType = "praise" | "constructive";
export type FeedbackVisibility = "private" | "manager" | "public";

export interface Feedback {
  fromPersonId: string;
  toPersonId: string;
  type: FeedbackType;
  visibility: FeedbackVisibility;
  text: string;
  createdAt: string;
}

export interface PdiAction {
  description: string;
  dueDate?: string;
  status: "pending" | "in_progress" | "done";
}

export interface Pdi {
  personId: string;
  competencyId?: string;
  /** liga o PDI a um laudo DISC do disc-engine (sessionId), quando a ação
   *  nasceu da camada "development" do laudo — ver disc-engine/src/content/blocks/development.ts */
  sourceDiscSessionId?: string;
  actions: PdiAction[];
  targetDate?: string;
  status: "open" | "closed";
}

export type ReviewCycleType = "90" | "180" | "360";
export type ReviewCycleStatus = "draft" | "open" | "calibration" | "closed";

export interface ReviewCycle {
  name: string;
  periodStart: string;
  periodEnd: string;
  type: ReviewCycleType;
  status: ReviewCycleStatus;
}

export type ReviewerRelationship = "self" | "manager" | "peer" | "report";

export interface CompetencyRating {
  competencyId: string;
  score: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface ReviewAssignment {
  cycleId: string;
  subjectPersonId: string;
  reviewerPersonId: string;
  relationship: ReviewerRelationship;
  status: "pending" | "submitted";
  ratings: CompetencyRating[];
  overallComment?: string;
  submittedAt?: string;
}

/** 1 = baixo, 2 = médio, 3 = alto — nas duas dimensões, como na matriz 9-box clássica. */
export type NineBoxLevel = 1 | 2 | 3;

export interface NineBoxPlacement {
  cycleId: string;
  personId: string;
  performanceLevel: NineBoxLevel;
  potentialLevel: NineBoxLevel;
  placedBy?: string;
  placedAt: string;
  notes?: string;
}

export const PERFORMANCE_ENTITY_TYPES = {
  goal: "goal",
  checkIn: "check_in",
  oneOnOne: "one_on_one",
  feedback: "feedback",
  pdi: "pdi",
  reviewCycle: "review_cycle",
  reviewAssignment: "review_assignment",
  nineBoxPlacement: "nine_box_placement",
} as const;
