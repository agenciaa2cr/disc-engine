import type { Router } from "../router.js";
import type { Services } from "../services.js";
import { sendJson } from "../http.js";
import { averageTimeToHireDays, costPerHire, funnelConversion, headcountOverTime, turnoverRate } from "../../analytics/queries.js";

export function registerAnalyticsRoutes(router: Router, services: Services): void {
  const { core, ats } = services;

  router.get("/orgs/:orgId/analytics/headcount", async ({ res, params, url }) => {
    const months = Number(url.searchParams.get("months") ?? "12");
    const people = await core.listPeople(params.orgId!); // ativos e inativos — o cálculo trata os dois
    const inactive = await core.listPeople(params.orgId!, { status: "inactive" });
    sendJson(res, 200, headcountOverTime([...people, ...inactive], new Date(), months));
  });

  router.get("/orgs/:orgId/analytics/turnover", async ({ res, params, url }) => {
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!start || !end) return sendJson(res, 400, { error: "informe ?start=YYYY-MM-DD&end=YYYY-MM-DD" });
    const active = await core.listPeople(params.orgId!, { status: "active" });
    const inactive = await core.listPeople(params.orgId!, { status: "inactive" });
    const rate = turnoverRate([...active, ...inactive], new Date(start), new Date(end));
    sendJson(res, 200, { rate });
  });

  router.get("/orgs/:orgId/postings/:id/analytics/funnel", async ({ res, params }) => {
    const counts = await ats.fitFunnelCounts(params.orgId!, params.id!);
    sendJson(res, 200, funnelConversion(counts));
  });

  router.get("/orgs/:orgId/postings/:id/analytics/time-to-hire", async ({ res, params }) => {
    const applications = await ats.listApplicationsForPosting(params.orgId!, params.id!);
    sendJson(res, 200, { averageDays: averageTimeToHireDays(applications) ?? null });
  });

  router.get("/orgs/:orgId/analytics/cost-per-hire", async ({ res, params, url }) => {
    const totalSpend = Number(url.searchParams.get("totalSpend") ?? "0");
    const postings = await ats.listAllPostings(params.orgId!);
    let hires = 0;
    for (const posting of postings) {
      const counts = await ats.fitFunnelCounts(params.orgId!, posting.id);
      hires += counts.hired;
    }
    sendJson(res, 200, { costPerHire: costPerHire(totalSpend, hires) ?? null, totalHires: hires });
  });
}
