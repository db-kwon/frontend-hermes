import type { RouteMap } from "./route.js";
import type { ComponentMap } from "./component.js";
import type { ApiCall } from "./apiCall.js";
import type { ReduxUsage } from "./reduxUsage.js";
import type { FileGraph } from "./fileGraph.js";

export type IndexFile = {
  version: "1";
  indexedAt: string;
  monorepoRoot: string;
  apps: string[];
  routes: RouteMap;
  components: ComponentMap;
  apiCalls: ApiCall[];
  reduxUsage: ReduxUsage;
  fileGraph: FileGraph;
};
