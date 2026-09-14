import type { Router } from "../router.js";
import type { Services } from "../services.js";
import { readJsonBody, sendJson } from "../http.js";
import type { Course, OffboardingInterview, SuccessionPlan } from "../../training/types.js";

export function registerTrainingRoutes(router: Router, services: Services): void {
  const { training } = services;

  router.post("/orgs/:orgId/courses", async ({ req, res, params }) => {
    const body = await readJsonBody<Course>(req);
    sendJson(res, 201, await training.createCourse(params.orgId!, body));
  });

  router.get("/orgs/:orgId/courses", async ({ res, params }) => {
    sendJson(res, 200, await training.listCourses(params.orgId!));
  });

  router.post("/orgs/:orgId/enrollments", async ({ req, res, params }) => {
    const body = await readJsonBody<{ personId: string; courseId: string }>(req);
    sendJson(res, 201, await training.enroll(params.orgId!, body.personId, body.courseId));
  });

  router.post("/enrollments/:id/complete", async ({ req, res, params }) => {
    const body = await readJsonBody<{ certificateUrl?: string }>(req);
    const enrollment = await training.completeEnrollment(params.id!, body.certificateUrl);
    if (!enrollment) return sendJson(res, 404, { error: "matrícula não encontrada" });
    sendJson(res, 200, enrollment);
  });

  router.get("/orgs/:orgId/people/:personId/enrollments", async ({ res, params }) => {
    sendJson(res, 200, await training.listEnrollmentsForPerson(params.orgId!, params.personId!));
  });

  router.post("/orgs/:orgId/people/:personId/onboarding", async ({ req, res, params }) => {
    const body = await readJsonBody<{ buddyPersonId?: string }>(req);
    sendJson(res, 201, await training.startOnboarding(params.orgId!, params.personId!, body.buddyPersonId));
  });

  router.post("/onboarding/:id/items/:index/complete", async ({ res, params }) => {
    const checklist = await training.completeOnboardingItem(params.id!, Number(params.index));
    if (!checklist) return sendJson(res, 404, { error: "checklist não encontrado" });
    sendJson(res, 200, checklist);
  });

  router.get("/onboarding/:id/progress", async ({ res, params }) => {
    const progress = await training.onboardingProgress(params.id!);
    if (progress === undefined) return sendJson(res, 404, { error: "checklist não encontrado" });
    sendJson(res, 200, { progress });
  });

  router.post("/orgs/:orgId/succession-plans", async ({ req, res, params }) => {
    const body = await readJsonBody<SuccessionPlan>(req);
    sendJson(res, 201, await training.createSuccessionPlan(params.orgId!, body));
  });

  router.get("/orgs/:orgId/roles/:roleId/bench-strength", async ({ res, params }) => {
    sendJson(res, 200, await training.benchStrength(params.orgId!, params.roleId!));
  });

  router.post("/orgs/:orgId/offboarding-interviews", async ({ req, res, params }) => {
    const body = await readJsonBody<OffboardingInterview>(req);
    sendJson(res, 201, await training.recordOffboardingInterview(params.orgId!, body));
  });

  router.get("/orgs/:orgId/offboarding-interviews", async ({ res, params }) => {
    sendJson(res, 200, await training.listOffboardingInterviews(params.orgId!));
  });
}
