import { newId, type Entity, type EntityQuery, type EntityStore } from "./entity.js";

/** Implementação em memória — usada em teste e quando PG_HOST não está
 *  configurado. Não sobrevive a reinício do processo. */
export class MemoryEntityStore implements EntityStore {
  private rows = new Map<string, Entity<unknown>>();

  async create<T>(orgId: string, type: string, data: T, id?: string): Promise<Entity<T>> {
    const now = new Date().toISOString();
    const row: Entity<T> = { id: id ?? newId(), orgId, type, data, createdAt: now, updatedAt: now };
    this.rows.set(row.id, row);
    return row;
  }

  async get<T>(id: string): Promise<Entity<T> | undefined> {
    return this.rows.get(id) as Entity<T> | undefined;
  }

  async update<T>(id: string, patchData: Partial<T>): Promise<Entity<T> | undefined> {
    const row = this.rows.get(id) as Entity<T> | undefined;
    if (!row) return undefined;
    row.data = { ...(row.data as object), ...(patchData as object) } as T;
    row.updatedAt = new Date().toISOString();
    return row;
  }

  async replace<T>(id: string, data: T): Promise<Entity<T> | undefined> {
    const row = this.rows.get(id) as Entity<T> | undefined;
    if (!row) return undefined;
    row.data = data;
    row.updatedAt = new Date().toISOString();
    return row;
  }

  async softDelete(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.deletedAt = new Date().toISOString();
  }

  async list<T>(query: EntityQuery): Promise<Entity<T>[]> {
    const out: Entity<T>[] = [];
    for (const row of this.rows.values()) {
      if (row.orgId !== query.orgId || row.type !== query.type) continue;
      if (!query.includeDeleted && row.deletedAt) continue;
      if (query.where) {
        const data = row.data as Record<string, unknown>;
        const matches = Object.entries(query.where).every(([k, v]) => data[k] === v);
        if (!matches) continue;
      }
      out.push(row as Entity<T>);
    }
    return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}
