// Servidor HTTP mínimo, sem framework — só `node:http`. O motor (src/) não
// depende disto em nada; esta é a casca fina que expõe ele como serviço,
// pensada para ser embutida depois nas rotas do Next.js da Fase 2 (ver
// arquitetura na proposta) sem precisar reescrever a lógica de negócio.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { buildSessionPlan } from "../instrument/session.js";
import { computeProfileFacts } from "../pipeline.js";
import { buildAllReports, buildReport } from "../reports/report.js";
import { renderReportHtml } from "../reports/render.js";
import { htmlToPdf } from "../reports/pdf.js";
import { computeTeamSummary } from "../reports/team.js";
import { createStore } from "./store.js";
import type { Audience, JobTarget, SessionResponses } from "../types.js";

const store = createStore();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4100; // mesma porta do disc-server original

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}

function sendText(res: ServerResponse, status: number, body: string, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {} as T;
  return JSON.parse(raw) as T;
}

const AUDIENCES: Audience[] = ["candidato", "recrutador", "gestor", "equipe"];

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method ?? "GET";

  try {
    if (method === "GET" && parts.length === 1 && parts[0] === "health") {
      return sendJson(res, 200, { status: "ok", service: "disc-engine", version: "2.0.0" });
    }

    // POST /sessions
    if (method === "POST" && parts.length === 1 && parts[0] === "sessions") {
      const body = await readJsonBody<{ orgId?: string; candidateName?: string; jobTarget?: JobTarget }>(req);
      const session = await store.createSession(body);
      const plan = buildSessionPlan(session.id);
      return sendJson(res, 201, { sessionId: session.id, plan });
    }

    // GET /sessions/:id/plan
    if (method === "GET" && parts.length === 3 && parts[0] === "sessions" && parts[2] === "plan") {
      const sessionId = parts[1]!;
      const session = await store.getSession(sessionId);
      if (!session) return sendJson(res, 404, { error: "sessão não encontrada" });
      return sendJson(res, 200, { sessionId, plan: buildSessionPlan(sessionId) });
    }

    // POST /sessions/:id/responses
    if (method === "POST" && parts.length === 3 && parts[0] === "sessions" && parts[2] === "responses") {
      const sessionId = parts[1]!;
      const session = await store.getSession(sessionId);
      if (!session) return sendJson(res, 404, { error: "sessão não encontrada" });

      const responses = await readJsonBody<SessionResponses>(req);
      await store.saveResponses(sessionId, responses);

      const facts = computeProfileFacts(responses, session.jobTarget ? { jobTarget: session.jobTarget } : {});
      const reports = buildAllReports(sessionId, facts);
      for (const audience of AUDIENCES) await store.saveReport(sessionId, audience, reports[audience]);

      return sendJson(res, 200, { pattern: facts.pattern, validity: facts.validity, jobFit: facts.jobFit ?? null });
    }

    // GET /sessions/:id/report/:audience[/pdf]
    if (method === "GET" && parts.length >= 4 && parts[0] === "sessions" && parts[2] === "report") {
      const sessionId = parts[1]!;
      const audience = parts[3] as Audience;
      const wantsPdf = parts[4] === "pdf";
      if (!AUDIENCES.includes(audience)) return sendJson(res, 400, { error: `audiência inválida: ${audience}` });

      let report = await store.getReport(sessionId, audience);
      if (!report) {
        // recompõe on-the-fly se ainda não foi persistido (ex.: biblioteca mudou desde o último cálculo)
        const responses = await store.getResponses(sessionId);
        if (!responses) return sendJson(res, 404, { error: "sessão sem respostas registradas" });
        const session = await store.getSession(sessionId);
        const facts = computeProfileFacts(responses, session?.jobTarget ? { jobTarget: session.jobTarget } : {});
        report = buildReport(sessionId, audience, facts);
        await store.saveReport(sessionId, audience, report);
      }

      await store.logAccess(sessionId, audience, req.headers["x-user-id"] as string | undefined);

      if (wantsPdf) {
        const responses = await store.getResponses(sessionId);
        const session = await store.getSession(sessionId);
        const facts = computeProfileFacts(responses!, session?.jobTarget ? { jobTarget: session.jobTarget } : {});
        const html = renderReportHtml(report, facts, { candidateName: session?.candidateName });
        const pdf = await htmlToPdf(html);
        res.writeHead(200, { "Content-Type": "application/pdf", "Content-Length": pdf.length });
        res.end(pdf);
        return;
      }

      return sendJson(res, 200, report);
    }

    // POST /teams/summary  { sessionIds: string[] }
    if (method === "POST" && parts.length === 2 && parts[0] === "teams" && parts[1] === "summary") {
      const body = await readJsonBody<{ sessionIds: string[] }>(req);
      const allFacts = [];
      for (const id of body.sessionIds ?? []) {
        const responses = await store.getResponses(id);
        if (!responses) continue;
        const session = await store.getSession(id);
        allFacts.push(computeProfileFacts(responses, session?.jobTarget ? { jobTarget: session.jobTarget } : {}));
      }
      return sendJson(res, 200, computeTeamSummary(allFacts));
    }

    return sendJson(res, 404, { error: "rota não encontrada" });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "erro interno", detail: err instanceof Error ? err.message : String(err) });
  }
}

const server = createServer((req, res) => {
  void handle(req, res);
});

server.listen(PORT, () => {
  console.log(`DISC 2.0 engine rodando em :${PORT} (banco: ${process.env.PG_HOST ? "Postgres" : "memória, sem persistência"})`);
});
