import type { Condition } from "../types.js";

/** Açúcar sintático para montar condições sem repetir chaves de objeto. */
export const gte = (field: string, value: number): Condition => ({ op: "cmp", field, cmp: "gte", value });
export const lte = (field: string, value: number): Condition => ({ op: "cmp", field, cmp: "lte", value });
export const gt = (field: string, value: number): Condition => ({ op: "cmp", field, cmp: "gt", value });
export const lt = (field: string, value: number): Condition => ({ op: "cmp", field, cmp: "lt", value });
export const eqStr = (field: string, value: string): Condition => ({ op: "eqStr", field, value });
export const includesVal = (field: string, value: string): Condition => ({ op: "includes", field, value });
export const exists = (field: string): Condition => ({ op: "exists", field });
export const boolIs = (field: string, value: boolean): Condition => ({ op: "bool", field, value });
export const and = (...conditions: Condition[]): Condition => ({ op: "and", conditions });
export const or = (...conditions: Condition[]): Condition => ({ op: "or", conditions });
export const not = (condition: Condition): Condition => ({ op: "not", condition });
export const always: Condition = { op: "always" };

/** Limiares de percentil compartilhados por toda a biblioteca de conteúdo,
 *  para que mudar um corte não signifique caçar números espalhados. */
export const THRESH = {
  alta: 65,
  baixa: 35,
} as const;
