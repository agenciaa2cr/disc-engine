import { isDatabaseConfigured } from "./db.js";
import { MemoryEntityStore } from "./memory-store.js";
import { PgEntityStore } from "./pg-store.js";
import type { EntityStore } from "./entity.js";

export * from "./entity.js";

export function createEntityStore(): EntityStore {
  return isDatabaseConfigured() ? new PgEntityStore() : new MemoryEntityStore();
}
