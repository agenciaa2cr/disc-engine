import type { Router } from "../router.js";
import type { Services } from "../services.js";
import { readJsonBody, sendJson } from "../http.js";
import type { Competency, JobRole, Person, RoleCompetencyLink } from "../../core/types.js";

export function registerCoreRoutes(router: Router, services: Services): void {
  const { core } = services;

  router.post("/orgs/:orgId/people", async ({ req, res, params }) => {
    const body = await readJsonBody<Person>(req);
    const person = await core.createPerson(params.orgId!, body);
    sendJson(res, 201, person);
  });

  router.get("/orgs/:orgId/people", async ({ res, params, url }) => {
    const status = url.searchParams.get("status") as "active" | "inactive" | null;
    const people = await core.listPeople(params.orgId!, status ? { status } : {});
    sendJson(res, 200, people);
  });

  router.get("/orgs/:orgId/org-chart", async ({ res, params }) => {
    sendJson(res, 200, await core.orgChart(params.orgId!));
  });

  router.post("/orgs/:orgId/roles", async ({ req, res, params }) => {
    const body = await readJsonBody<JobRole>(req);
    sendJson(res, 201, await core.createJobRole(params.orgId!, body));
  });

  router.get("/orgs/:orgId/roles", async ({ res, params }) => {
    sendJson(res, 200, await core.listJobRoles(params.orgId!));
  });

  router.post("/orgs/:orgId/competencies", async ({ req, res, params }) => {
    const body = await readJsonBody<Competency>(req);
    sendJson(res, 201, await core.createCompetency(params.orgId!, body));
  });

  router.get("/orgs/:orgId/competencies", async ({ res, params }) => {
    sendJson(res, 200, await core.listCompetencies(params.orgId!));
  });

  router.post("/orgs/:orgId/role-competencies", async ({ req, res, params }) => {
    const body = await readJsonBody<RoleCompetencyLink>(req);
    sendJson(res, 201, await core.linkRoleCompetency(params.orgId!, body));
  });

  router.get("/orgs/:orgId/competency-matrix", async ({ res, params }) => {
    sendJson(res, 200, await core.competencyMatrix(params.orgId!));
  });
}
