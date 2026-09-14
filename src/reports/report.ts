import { composeSections } from "../content/compose.js";
import { CONTENT_LIBRARY_VERSION } from "../content/library.js";
import { ENGINE_VERSION } from "../version.js";
import type { Audience, ProfileFacts, Report } from "../types.js";

/**
 * Monta o laudo completo para uma audiência. Determinístico: mesma
 * sessionId + mesmos facts + mesma versão de biblioteca → mesmo laudo,
 * sempre — é a propriedade que torna o laudo reproduzível e auditável.
 */
export function buildReport(sessionId: string, audience: Audience, facts: ProfileFacts): Report {
  return {
    sessionId,
    audience,
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    contentLibraryVersion: CONTENT_LIBRARY_VERSION,
    pattern: facts.pattern,
    sections: composeSections(audience, facts, sessionId),
    validity: facts.validity,
  };
}

export function buildAllReports(sessionId: string, facts: ProfileFacts): Record<Audience, Report> {
  return {
    candidato: buildReport(sessionId, "candidato", facts),
    recrutador: buildReport(sessionId, "recrutador", facts),
    gestor: buildReport(sessionId, "gestor", facts),
    equipe: buildReport(sessionId, "equipe", facts), // seções vazias — ver src/reports/team.ts para o agregado real
  };
}
