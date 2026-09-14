export type PersonStatus = "active" | "inactive";
/** "dp_sync" = veio do conector somente-leitura do sistema de DP (ver
 *  proposta, seção 2 — fronteira com o departamento pessoal). "manual" =
 *  cadastrado direto na suíte (ex.: antes de existir integração). */
export type PersonSource = "dp_sync" | "manual";

export interface Person {
  name: string;
  email: string;
  roleId?: string;
  managerId?: string;
  department?: string;
  hireDate?: string; // ISO date
  status: PersonStatus;
  source: PersonSource;
  externalId?: string; // id no sistema de DP, quando source === "dp_sync"
  terminatedAt?: string;
}

export interface JobRole {
  name: string;
  family?: string;
  level?: string;
  description?: string;
}

export interface Competency {
  name: string;
  category?: string;
  description?: string;
}

/** Nível-alvo de 1 (básico) a 5 (referência) de uma competência para um cargo. */
export interface RoleCompetencyLink {
  roleId: string;
  competencyId: string;
  targetLevel: 1 | 2 | 3 | 4 | 5;
}

export const CORE_ENTITY_TYPES = {
  person: "person",
  jobRole: "job_role",
  competency: "competency",
  roleCompetencyLink: "role_competency_link",
} as const;
