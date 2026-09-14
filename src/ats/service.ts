import type { Entity, EntityStore } from "../store/entity.js";
import { CoreService } from "../core/service.js";
import { canTransition } from "./pipeline.js";
import { ATS_ENTITY_TYPES, type Application, type Candidate, type JobPosting, type PipelineStage } from "./types.js";

export class TransitionError extends Error {}

export class AtsService {
  private core: CoreService;

  constructor(private store: EntityStore) {
    this.core = new CoreService(store);
  }

  // --- Vagas -----------------------------------------------------------------
  async createPosting(orgId: string, posting: Omit<JobPosting, "status">): Promise<Entity<JobPosting>> {
    return this.store.create(orgId, ATS_ENTITY_TYPES.jobPosting, { ...posting, status: "draft" } satisfies JobPosting);
  }

  async publishPosting(id: string): Promise<Entity<JobPosting> | undefined> {
    return this.store.update<JobPosting>(id, { status: "open", publishedAt: new Date().toISOString() });
  }

  async closePosting(id: string): Promise<Entity<JobPosting> | undefined> {
    return this.store.update<JobPosting>(id, { status: "closed", closedAt: new Date().toISOString() });
  }

  /** O que a página de carreiras pública lista — só vagas com status "open". */
  async listOpenPostings(orgId: string): Promise<Entity<JobPosting>[]> {
    return this.store.list<JobPosting>({ orgId, type: ATS_ENTITY_TYPES.jobPosting, where: { status: "open" } });
  }

  async listAllPostings(orgId: string): Promise<Entity<JobPosting>[]> {
    return this.store.list<JobPosting>({ orgId, type: ATS_ENTITY_TYPES.jobPosting });
  }

  // --- Candidatos --------------------------------------------------------------
  async createCandidate(orgId: string, candidate: Candidate): Promise<Entity<Candidate>> {
    return this.store.create(orgId, ATS_ENTITY_TYPES.candidate, candidate);
  }

  async listTalentPool(orgId: string): Promise<Entity<Candidate>[]> {
    return this.store.list<Candidate>({ orgId, type: ATS_ENTITY_TYPES.candidate, where: { inTalentPool: true } });
  }

  // --- Candidaturas e funil -----------------------------------------------------
  async apply(orgId: string, candidateId: string, postingId: string): Promise<Entity<Application>> {
    const now = new Date().toISOString();
    const application: Application = {
      candidateId,
      postingId,
      stage: "applied",
      history: [{ from: "applied", to: "applied", at: now, note: "candidatura recebida" }],
      createdAt: now,
    };
    return this.store.create(orgId, ATS_ENTITY_TYPES.application, application);
  }

  async linkDiscSession(applicationId: string, discSessionId: string): Promise<Entity<Application> | undefined> {
    return this.store.update<Application>(applicationId, { discSessionId });
  }

  async transitionStage(applicationId: string, to: PipelineStage, opts: { by?: string; note?: string } = {}): Promise<Entity<Application>> {
    const app = await this.store.get<Application>(applicationId);
    if (!app) throw new TransitionError(`candidatura ${applicationId} não encontrada`);
    if (!canTransition(app.data.stage, to)) {
      throw new TransitionError(`transição inválida: ${app.data.stage} → ${to}`);
    }
    const at = new Date().toISOString();
    const history = [...app.data.history, { from: app.data.stage, to, at, by: opts.by, note: opts.note }];
    const updated = await this.store.update<Application>(applicationId, { stage: to, history });
    return updated!;
  }

  /** Contratação: fecha o funil E cria a pessoa no core, já com o cargo da
   *  vaga — o ponto de junção real entre R&S e o resto da suíte. */
  async hire(orgId: string, applicationId: string, hireDate: string, opts: { by?: string } = {}) {
    const app = await this.transitionStage(applicationId, "hired", { by: opts.by, note: "contratado(a)" });
    const [candidate, posting] = await Promise.all([
      this.store.get<Candidate>(app.data.candidateId),
      this.store.get<JobPosting>(app.data.postingId),
    ]);
    if (!candidate) throw new TransitionError(`candidato ${app.data.candidateId} não encontrado`);
    const person = await this.core.createPerson(orgId, {
      name: candidate.data.name,
      email: candidate.data.email,
      roleId: posting?.data.roleId,
      status: "active",
      source: "manual",
      hireDate,
    });
    return { application: app, person };
  }

  async listApplicationsForPosting(orgId: string, postingId: string): Promise<Entity<Application>[]> {
    return this.store.list<Application>({ orgId, type: ATS_ENTITY_TYPES.application, where: { postingId } });
  }

  async listApplicationsForCandidate(orgId: string, candidateId: string): Promise<Entity<Application>[]> {
    return this.store.list<Application>({ orgId, type: ATS_ENTITY_TYPES.application, where: { candidateId } });
  }

  // --- Métrica simples de funil (base para analytics) ---------------------------
  async fitFunnelCounts(orgId: string, postingId: string): Promise<Record<PipelineStage, number>> {
    const apps = await this.listApplicationsForPosting(orgId, postingId);
    const counts: Record<PipelineStage, number> = { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
    for (const a of apps) counts[a.data.stage] += 1;
    return counts;
  }
}
