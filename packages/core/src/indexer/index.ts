import path from "node:path";
import fs from "node:fs";
import { createProject } from "./project.js";
import { parseRoutes } from "./routes.js";
import { parseComponents } from "./components.js";
import { parseApiCalls } from "./apiCalls/index.js";
import { parseReduxUsage } from "./reduxUsage.js";
import { buildFileGraph } from "./fileGraph.js";
import type { IndexFile } from "../types/indexFile.js";

function detectApps(root: string): string[] {
  const appsDir = path.join(root, "apps");
  if (!fs.existsSync(appsDir)) return [];
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function buildIndex(root: string): IndexFile {
  const project = createProject(root);
  const routes = parseRoutes(project, root);
  const components = parseComponents(project, root);
  const apiCalls = parseApiCalls(project, root);
  return {
    version: "1",
    indexedAt: new Date().toISOString(),
    monorepoRoot: root,
    apps: detectApps(root),
    routes,
    components,
    apiCalls,
    reduxUsage: parseReduxUsage(project, root),
    fileGraph: buildFileGraph(project, root),
  };
}

export { writeIndex } from "./writer.js";
