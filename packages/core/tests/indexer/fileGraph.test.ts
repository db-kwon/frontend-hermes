import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../src/indexer/project.js";
import { buildFileGraph } from "../../src/indexer/fileGraph.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("buildFileGraph", () => {
  it("includes reverse importedBy edges", () => {
    const project = createProject(FIXTURE_ROOT);
    const graph = buildFileGraph(project, FIXTURE_ROOT);
    const apiFile =
      "apps/admin/src/domains/hospital/api/hospitalApi.ts";
    expect(graph[apiFile]).toBeDefined();
    expect(graph[apiFile]!.importedBy).toContain(
      "apps/admin/src/domains/hospital/containers/HospitalDetailContainer.tsx"
    );
  });
});
