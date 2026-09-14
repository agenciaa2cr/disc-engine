import type { Condition, ProfileFacts } from "../types.js";

/**
 * Avaliador de condições estruturadas contra os fatos de um protocolo.
 *
 * Deliberadamente NÃO existe um caminho que avalie string como código —
 * uma condição malformada no banco de conteúdo simplesmente não casa com
 * nada (retorna false), nunca executa nada. É o que torna seguro guardar
 * a biblioteca de blocos como dado editável em banco: o pior caso de uma
 * entrada corrompida é "esse bloco nunca aparece", não execução arbitrária.
 */
export function evaluateCondition(condition: Condition, facts: ProfileFacts): boolean {
  switch (condition.op) {
    case "always":
      return true;
    case "cmp": {
      const v = resolveField(facts, condition.field);
      if (typeof v !== "number") return false;
      switch (condition.cmp) {
        case "gte":
          return v >= condition.value;
        case "lte":
          return v <= condition.value;
        case "gt":
          return v > condition.value;
        case "lt":
          return v < condition.value;
        case "eq":
          return v === condition.value;
        case "neq":
          return v !== condition.value;
      }
      return false;
    }
    case "eqStr": {
      const v = resolveField(facts, condition.field);
      return typeof v === "string" && v === condition.value;
    }
    case "includes": {
      const v = resolveField(facts, condition.field);
      return Array.isArray(v) && v.includes(condition.value);
    }
    case "exists": {
      const v = resolveField(facts, condition.field);
      return v !== undefined && v !== null;
    }
    case "bool": {
      const v = resolveField(facts, condition.field);
      return typeof v === "boolean" && v === condition.value;
    }
    case "and":
      return condition.conditions.every((c) => evaluateCondition(c, facts));
    case "or":
      return condition.conditions.some((c) => evaluateCondition(c, facts));
    case "not":
      return !evaluateCondition(condition.condition, facts);
  }
}

/** Resolve um caminho tipo "percentile.natural.D" contra o objeto de fatos. */
export function resolveField(facts: ProfileFacts, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = facts;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}
