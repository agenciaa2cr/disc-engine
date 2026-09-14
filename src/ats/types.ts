export type PostingStatus = "draft" | "open" | "closed";

export interface CompetencyRequirement {
  competencyId: string;
  minLevel: 1 | 2 | 3 | 4 | 5;
}

export interface JobPosting {
  title: string;
  roleId?: string;
  status: PostingStatus;
  description: string;
  location?: string;
  remote?: boolean;
  /** perfil-alvo DISC da vaga, em percentil — mesmo formato que
   *  disc-engine's PercentileVector, sem importar o pacote (evita
   *  acoplar hr-suite à build de disc-engine; o formato é o contrato). */
  targetDiscProfile?: { D: number; I: number; S: number; C: number };
  competencyRequirements?: CompetencyRequirement[];
  createdBy?: string;
  publishedAt?: string;
  closedAt?: string;
}

export type CandidateSource = "career_page" | "referral" | "sourced" | "talent_pool";

export interface Candidate {
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  source: CandidateSource;
  tags?: string[];
  /** true = está no banco de talentos, disponível para qualquer vaga futura,
   *  não só a que trouxe o candidato originalmente */
  inTalentPool?: boolean;
}

export const PIPELINE_STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export const TERMINAL_STAGES: readonly PipelineStage[] = ["hired", "rejected"];

export interface StageTransition {
  from: PipelineStage;
  to: PipelineStage;
  at: string;
  by?: string;
  note?: string;
}

export interface Application {
  candidateId: string;
  postingId: string;
  stage: PipelineStage;
  discSessionId?: string;
  history: StageTransition[];
  createdAt: string;
}

export const ATS_ENTITY_TYPES = {
  jobPosting: "job_posting",
  candidate: "candidate",
  application: "application",
} as const;
