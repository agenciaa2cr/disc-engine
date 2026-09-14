import type { Entity, EntityStore } from "../store/entity.js";
import { CORE_ENTITY_TYPES, type Competency, type JobRole, type Person, type RoleCompetencyLink } from "./types.js";

export interface OrgChartNode {
  person: Entity<Person>;
  reports: OrgChartNode[];
}

export class CoreService {
  constructor(private store: EntityStore) {}

  // --- Pessoas -------------------------------------------------------------
  async createPerson(orgId: string, person: Person): Promise<Entity<Person>> {
    return this.store.create(orgId, CORE_ENTITY_TYPES.person, person);
  }

  async upsertFromDpSync(orgId: string, externalId: string, person: Omit<Person, "source" | "externalId">): Promise<Entity<Person>> {
    const existing = await this.store.list<Person>({ orgId, type: CORE_ENTITY_TYPES.person, where: { externalId } });
    const payload: Person = { ...person, source: "dp_sync", externalId };
    if (existing[0]) {
      const updated = await this.store.replace<Person>(existing[0].id, payload);
      return updated!;
    }
    return this.store.create(orgId, CORE_ENTITY_TYPES.person, payload);
  }

  async getPerson(id: string): Promise<Entity<Person> | undefined> {
    return this.store.get<Person>(id);
  }

  async listPeople(orgId: string, opts: { status?: "active" | "inactive" } = {}): Promise<Entity<Person>[]> {
    return this.store.list<Person>({ orgId, type: CORE_ENTITY_TYPES.person, where: opts.status ? { status: opts.status } : undefined });
  }

  async updatePerson(id: string, patch: Partial<Person>): Promise<Entity<Person> | undefined> {
    return this.store.update<Person>(id, patch);
  }

  async deactivatePerson(id: string, terminatedAt: string): Promise<Entity<Person> | undefined> {
    return this.store.update<Person>(id, { status: "inactive", terminatedAt });
  }

  /** Monta a árvore de organograma a partir de managerId. Pessoas cujo
   *  managerId não existe (ou está vazio) viram raiz — várias raízes é
   *  esperado (diretoria, ou dado de DP ainda incompleto). */
  async orgChart(orgId: string): Promise<OrgChartNode[]> {
    const people = await this.listPeople(orgId, { status: "active" });
    const byManager = new Map<string, Entity<Person>[]>();
    const roots: Entity<Person>[] = [];
    for (const p of people) {
      if (p.data.managerId) {
        const list = byManager.get(p.data.managerId) ?? [];
        list.push(p);
        byManager.set(p.data.managerId, list);
      } else {
        roots.push(p);
      }
    }
    const build = (p: Entity<Person>): OrgChartNode => ({ person: p, reports: (byManager.get(p.id) ?? []).map(build) });
    return roots.map(build);
  }

  // --- Cargos e competências -------------------------------------------------
  async createJobRole(orgId: string, role: JobRole): Promise<Entity<JobRole>> {
    return this.store.create(orgId, CORE_ENTITY_TYPES.jobRole, role);
  }

  async listJobRoles(orgId: string): Promise<Entity<JobRole>[]> {
    return this.store.list<JobRole>({ orgId, type: CORE_ENTITY_TYPES.jobRole });
  }

  async createCompetency(orgId: string, competency: Competency): Promise<Entity<Competency>> {
    return this.store.create(orgId, CORE_ENTITY_TYPES.competency, competency);
  }

  async listCompetencies(orgId: string): Promise<Entity<Competency>[]> {
    return this.store.list<Competency>({ orgId, type: CORE_ENTITY_TYPES.competency });
  }

  async linkRoleCompetency(orgId: string, link: RoleCompetencyLink): Promise<Entity<RoleCompetencyLink>> {
    return this.store.create(orgId, CORE_ENTITY_TYPES.roleCompetencyLink, link);
  }

  async getRoleCompetencies(orgId: string, roleId: string): Promise<Entity<RoleCompetencyLink>[]> {
    return this.store.list<RoleCompetencyLink>({ orgId, type: CORE_ENTITY_TYPES.roleCompetencyLink, where: { roleId } });
  }

  /** Matriz de competências: para cada cargo, a lista de vínculos com nível-alvo. */
  async competencyMatrix(orgId: string): Promise<Record<string, Entity<RoleCompetencyLink>[]>> {
    const roles = await this.listJobRoles(orgId);
    const out: Record<string, Entity<RoleCompetencyLink>[]> = {};
    for (const role of roles) out[role.id] = await this.getRoleCompetencies(orgId, role.id);
    return out;
  }
}
