import { createEntityStore, type EntityStore } from "../store/index.js";
import { CoreService } from "../core/service.js";
import { AtsService } from "../ats/service.js";
import { PerformanceService } from "../performance/service.js";
import { ClimateService } from "../climate/service.js";
import { TrainingService } from "../training/service.js";

export interface Services {
  store: EntityStore;
  core: CoreService;
  ats: AtsService;
  performance: PerformanceService;
  climate: ClimateService;
  training: TrainingService;
}

export function buildServices(): Services {
  const store = createEntityStore();
  return {
    store,
    core: new CoreService(store),
    ats: new AtsService(store),
    performance: new PerformanceService(store),
    climate: new ClimateService(store),
    training: new TrainingService(store),
  };
}
