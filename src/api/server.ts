// Servidor HTTP unificado da suíte — sem framework, mesma filosofia do
// disc-engine. Cada módulo de domínio registra suas próprias rotas; este
// arquivo só sobe o processo e faz o roteamento de fato.
import { createServer } from "node:http";
import { Router } from "./router.js";
import { sendJson } from "./http.js";
import { buildServices } from "./services.js";
import { registerCoreRoutes } from "./routes/core.js";
import { registerAtsRoutes } from "./routes/ats.js";
import { registerPerformanceRoutes } from "./routes/performance.js";
import { registerClimateRoutes } from "./routes/climate.js";
import { registerTrainingRoutes } from "./routes/training.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4200;

const services = buildServices();
const router = new Router();

router.get("/health", async ({ res }) => {
  sendJson(res, 200, { status: "ok", service: "hr-suite", version: "0.1.0" });
});

registerCoreRoutes(router, services);
registerAtsRoutes(router, services);
registerPerformanceRoutes(router, services);
registerClimateRoutes(router, services);
registerTrainingRoutes(router, services);
registerAnalyticsRoutes(router, services);

const server = createServer((req, res) => {
  router
    .handle(req, res)
    .then((matched) => {
      if (!matched) sendJson(res, 404, { error: "rota não encontrada" });
    })
    .catch((err) => {
      console.error(err);
      if (!res.headersSent) sendJson(res, 500, { error: "erro interno", detail: err instanceof Error ? err.message : String(err) });
    });
});

server.listen(PORT, () => {
  console.log(`HR Suite rodando em :${PORT} (banco: ${process.env.PG_HOST ? "Postgres" : "memória, sem persistência"})`);
});
