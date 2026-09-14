import { randomUUID } from "node:crypto";

/**
 * Toda entidade de negócio da suíte (pessoa, vaga, meta, pesquisa...) passa
 * por este armazenamento genérico: uma linha com `type`, `orgId`, `data`
 * (o payload tipado da entidade) e metadados. É uma decisão deliberada,
 * não preguiça — ver README, seção "Por que uma tabela genérica de
 * entidades". Cada módulo (core, ats, performance, climate, training)
 * define seu próprio tipo TypeScript para `data` e uma camada de serviço
 * que valida forma e regra de negócio antes de gravar; o armazenamento em
 * si não sabe nem precisa saber o que é um "goal" ou uma "application".
 */
export interface Entity<T = unknown> {
  id: string;
  orgId: string;
  type: string;
  data: T;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface EntityQuery {
  orgId: string;
  type: string;
  /** filtro raso: campo-chave dentro de `data` == valor. Sem filtro composto
   *  nem aninhado — para consulta mais rica, liste e filtre em memória (o
   *  volume esperado nesta fase não justifica um query builder). */
  where?: Record<string, string | number | boolean>;
  includeDeleted?: boolean;
}

export interface EntityStore {
  create<T>(orgId: string, type: string, data: T, id?: string): Promise<Entity<T>>;
  get<T>(id: string): Promise<Entity<T> | undefined>;
  update<T>(id: string, patchData: Partial<T>): Promise<Entity<T> | undefined>;
  replace<T>(id: string, data: T): Promise<Entity<T> | undefined>;
  softDelete(id: string): Promise<void>;
  list<T>(query: EntityQuery): Promise<Entity<T>[]>;
}

export function newId(): string {
  return randomUUID();
}
