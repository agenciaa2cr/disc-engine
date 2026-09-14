import type { Router } from "../router.js";
import type { Services } from "../services.js";
import { readJsonBody, sendJson } from "../http.js";
import { GoalError } from "../../performance/service.js";
import type { Feedback, Goal, NineBoxLevel, OneOnOne, Pdi, ReviewCycle, ReviewerRelationship } from "../../performance/types.js";

export function registerPerformanceRoutes(router: Router, services: Services): void {
  const { performance } = services;

  router.post("/orgs/:orgId/goals", async ({ req, res, params }) => {
    const body = await readJsonBody<Omit<Goal, "status">>(req);
    try {
      sendJson(res, 201, await performance.createGoal(params.orgId!, body));
    } catch (err) {
      if (err instanceof GoalError) return sendJson(res, 400, { error: err.message });
      throw err;
    }
  });

  router.post("/goals/:id/checkin", async ({ req, res, params }) => {
    const body = await readJsonBody<{ progressValue: number; note?: string; by?: string }>(req);
    try {
      sendJson(res, 200, await performance.checkIn(params.id!, body.progressValue, body));
    } catch (err) {
      if (err instanceof GoalError) return sendJson(res, 404, { error: err.message });
      throw err;
    }
  });

  router.get("/orgs/:orgId/people/:personId/goals", async ({ res, params }) => {
    sendJson(res, 200, await performance.listGoalsForOwner(params.orgId!, params.personId!));
  });

  router.get("/orgs/:orgId/goals/:id/progress", async ({ res, params }) => {
    sendJson(res, 200, { progress: await performance.objectiveProgress(params.orgId!, params.id!) });
  });

  router.post("/orgs/:orgId/one-on-ones", async ({ req, res, params }) => {
    const body = await readJsonBody<OneOnOne>(req);
    sendJson(res, 201, await performance.createOneOnOne(params.orgId!, body));
  });

  router.get("/orgs/:orgId/people/:personId/one-on-ones", async ({ res, params }) => {
    sendJson(res, 200, await performance.listOneOnOnesForPerson(params.orgId!, params.personId!));
  });

  router.post("/orgs/:orgId/feedback", async ({ req, res, params }) => {
    const body = await readJsonBody<Omit<Feedback, "createdAt">>(req);
    sendJson(res, 201, await performance.giveFeedback(params.orgId!, body));
  });

  router.get("/orgs/:orgId/people/:personId/feedback", async ({ res, params, url }) => {
    const viewerId = url.searchParams.get("viewerId") ?? "";
    const viewerIsManager = url.searchParams.get("viewerIsManager") === "true";
    sendJson(res, 200, await performance.listFeedbackFor(params.orgId!, params.personId!, viewerId, viewerIsManager));
  });

  router.post("/orgs/:orgId/pdi", async ({ req, res, params }) => {
    const body = await readJsonBody<Omit<Pdi, "status">>(req);
    sendJson(res, 201, await performance.createPdi(params.orgId!, body));
  });

  router.post("/pdi/:id/actions/:index/status", async ({ req, res, params }) => {
    const body = await readJsonBody<{ status: "pending" | "in_progress" | "done" }>(req);
    const pdi = await performance.updatePdiAction(params.id!, Number(params.index), body.status);
    if (!pdi) return sendJson(res, 404, { error: "PDI não encontrado" });
    sendJson(res, 200, pdi);
  });

  router.get("/orgs/:orgId/people/:personId/pdi", async ({ res, params }) => {
    sendJson(res, 200, await performance.listPdiForPerson(params.orgId!, params.personId!));
  });

  router.post("/orgs/:orgId/review-cycles", async ({ req, res, params }) => {
    const body = await readJsonBody<Omit<ReviewCycle, "status">>(req);
    sendJson(res, 201, await performance.createReviewCycle(params.orgId!, body));
  });

  router.post("/review-cycles/:id/open", async ({ res, params }) => {
    const cycle = await performance.openReviewCycle(params.id!);
    if (!cycle) return sendJson(res, 404, { error: "ciclo não encontrado" });
    sendJson(res, 200, cycle);
  });

  router.post("/orgs/:orgId/review-cycles/:id/assign", async ({ req, res, params }) => {
    const body = await readJsonBody<{ subjectPersonId: string; reviewerPersonId: string; relationship: ReviewerRelationship }>(req);
    sendJson(res, 201, await performance.assignReviewer(params.orgId!, params.id!, body.subjectPersonId, body.reviewerPersonId, body.relationship));
  });

  router.post("/review-assignments/:id/submit", async ({ req, res, params }) => {
    const body = await readJsonBody<{ ratings: { competencyId: string; score: 1 | 2 | 3 | 4 | 5; comment?: string }[]; overallComment?: string }>(req);
    const assignment = await performance.submitReview(params.id!, body.ratings, body.overallComment);
    if (!assignment) return sendJson(res, 404, { error: "avaliação não encontrada" });
    sendJson(res, 200, assignment);
  });

  router.get("/orgs/:orgId/review-cycles/:id/completion", async ({ res, params }) => {
    sendJson(res, 200, { completionRate: await performance.cycleCompletionRate(params.orgId!, params.id!) });
  });

  router.post("/orgs/:orgId/nine-box", async ({ req, res, params }) => {
    const body = await readJsonBody<{ cycleId: string; personId: string; performanceLevel: NineBoxLevel; potentialLevel: NineBoxLevel; placedBy?: string; notes?: string }>(req);
    sendJson(
      res,
      201,
      await performance.placeNineBox(params.orgId!, body.cycleId, body.personId, body.performanceLevel, body.potentialLevel, body),
    );
  });

  router.get("/orgs/:orgId/review-cycles/:id/nine-box", async ({ res, params }) => {
    sendJson(res, 200, await performance.listNineBoxForCycle(params.orgId!, params.id!));
  });
}
