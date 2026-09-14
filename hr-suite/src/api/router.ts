import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Roteador mínimo — sem framework, mesma filosofia do disc-engine. Com
 * ~25 rotas nesta suíte um if/else viraria ilegível rápido, então aqui
 * entra um casador de padrão `:param` bem pequeno, não um Express
 * disfarçado. `params` sai tipado como Record<string,string> puro.
 */
export type Handler = (ctx: { req: IncomingMessage; res: ServerResponse; params: Record<string, string>; url: URL }) => Promise<void>;

interface Route {
  method: string;
  segments: string[]; // ex.: ["orgs", ":orgId", "people"]
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  add(method: string, pattern: string, handler: Handler): void {
    const segments = pattern.split("/").filter(Boolean);
    this.routes.push({ method, segments, handler });
  }

  get(pattern: string, handler: Handler) {
    this.add("GET", pattern, handler);
  }
  post(pattern: string, handler: Handler) {
    this.add("POST", pattern, handler);
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const method = req.method ?? "GET";

    for (const route of this.routes) {
      if (route.method !== method) continue;
      if (route.segments.length !== parts.length) continue;
      const params: Record<string, string> = {};
      let matched = true;
      for (let i = 0; i < route.segments.length; i++) {
        const seg = route.segments[i]!;
        const part = parts[i]!;
        if (seg.startsWith(":")) {
          params[seg.slice(1)] = decodeURIComponent(part);
        } else if (seg !== part) {
          matched = false;
          break;
        }
      }
      if (!matched) continue;
      await route.handler({ req, res, params, url });
      return true;
    }
    return false;
  }
}
