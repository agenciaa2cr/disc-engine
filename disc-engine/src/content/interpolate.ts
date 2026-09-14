import type { Dimension, ProfileFacts } from "../types.js";
import { resolveField } from "./evaluator.js";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  D: "Dominância",
  I: "Influência",
  S: "Estabilidade",
  C: "Conformidade",
};

/**
 * Interpolação de texto contra os fatos do perfil. Suporta dois formatos:
 *  - {{campo.aninhado}}      → valor bruto (número ou string)
 *  - {{dim:campo.aninhado}}  → resolve o campo (deve dar "D"/"I"/"S"/"C") e
 *                              devolve o rótulo por extenso ("Dominância")
 *
 * Isto é interpolação de string simples, não geração de texto — os únicos
 * valores possíveis são os que já estão em ProfileFacts. Não há chamada de
 * rede nem modelo de linguagem em lugar nenhum deste arquivo.
 */
export function interpolate(text: string, facts: ProfileFacts): string {
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, token: string) => {
    const trimmed = token.trim();
    if (trimmed.startsWith("dim:")) {
      const path = trimmed.slice(4).trim();
      const raw = resolveField(facts, path);
      if (typeof raw === "string" && raw in DIMENSION_LABELS) {
        return DIMENSION_LABELS[raw as Dimension];
      }
      return String(raw ?? "");
    }
    const raw = resolveField(facts, trimmed);
    if (raw === undefined || raw === null) return "";
    return String(raw);
  });
}
