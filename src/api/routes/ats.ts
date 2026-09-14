import type { Router } from "../router.js";
import type { Services } from "../services.js";
import { readJsonBody, sendJson } from "../http.js";
import { TransitionError } from "../../ats/service.js";
import type { Candidate, JobPosting, PipelineStage } from "../../ats/types.js";

export function registerAtsRoutes(router: Router, services: Services): void {
  const { ats } = services;

  router.post("/orgs/:orgId/postings", async ({ req, res, params }) => {
    const body = await readJsonBody<Omit<JobPosting, "status">>(req);
    sendJson(res, 201, await ats.createPosting(params.orgId!, body));
  });

  router.post("/postings/:id/publish", async ({ res, params }) => {
    const posting = await ats.publishPosting(params.id!);
    if (!posting) return sendJson(res, 404, { error: "vaga não encontrada" });
    sendJson(res, 200, posting);
  });

  router.post("/postings/:id/close", async ({ res, params }) => {
    const posting = await ats.closePosting(params.id!);
    if (!posting) return sendJson(res, 404, { error: "vaga não encontrada" });
    sendJson(res, 200, posting);
  });

  router.get("/orgs/:orgId/postings", async ({ res, params }) => {
    sendJson(res, 200, await ats.listAllPostings(params.orgId!));
  });

  // Página de carreiras pública — só o que está "open". Sem exigir
  // autenticação, é o endpoint que um site público chamaria.
  router.get("/careers/:orgId", async ({ res, params }) => {
    sendJson(res, 200, await ats.listOpenPostings(params.orgId!));
  });

  router.post("/orgs/:orgId/candidates", async ({ req, res, params }) => {
    const body = await readJsonBody<Candidate>(req);
    sendJson(res, 201, await ats.createCandidate(params.orgId!, body));
  });

  router.get("/orgs/:orgId/talent-pool", async ({ res, params }) => {
    sendJson(res, 200, await ats.listTalentPool(params.orgId!));
  });

  router.post("/orgs/:orgId/applications", async ({ req, res, params }) => {
    const body = await readJsonBody<{ candidateId: string; postingId: string }>(req);
    sendJson(res, 201, await ats.apply(params.orgId!, body.candidateId, body.postingId));
  });

  router.post("/applications/:id/transition", async ({ req, res, params }) => {
    const body = await readJsonBody<{ to: PipelineStage; by?: string; note?: string }>(req);
    try {
      sendJson(res, 200, await ats.transitionStage(params.id!, body.to, { by: body.by, note: body.note }));
    } catch (err) {
      if (err instanceof TransitionError) return sendJson(res, 400, { error: err.message });
      throw err;
    }
  });

  router.post("/applications/:id/hire", async ({ req, res, params }) => {
    const body = await readJsonBody<{ orgId: string; hireDate: string; by?: string }>(req);
    try {
      sendJson(res, 200, await ats.hire(body.orgId, params.id!, body.hireDate, { by: body.by }));
    } catch (err) {
      if (err instanceof TransitionError) return sendJson(res, 400, { error: err.message });
      throw err;
    }
  });

  router.post("/applications/:id/disc-session", async ({ req, res, params }) => {
    const body = await readJsonBody<{ discSessionId: string }>(req);
    const app = await ats.linkDiscSession(params.id!, body.discSessionId);
    if (!app) return sendJson(res, 404, { error: "candidatura não encontrada" });
    sendJson(res, 200, app);
  });

  router.get("/orgs/:orgId/postings/:id/applications", async ({ res, params }) => {
    sendJson(res, 200, await ats.listApplicationsForPosting(params.orgId!, params.id!));
  });

  router.get("/orgs/:orgId/postings/:id/funnel", async ({ res, params }) => {
    sendJson(res, 200, await ats.fitFunnelCounts(params.orgId!, params.id!));
  });
}
