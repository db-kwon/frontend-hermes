import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../src/indexer/project.js";
import { parseComponents } from "../../src/indexer/components.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("parseComponents", () => {
  it("captures imports and rendered components", () => {
    const project = createProject(FIXTURE_ROOT);
    const components = parseComponents(project, FIXTURE_ROOT);
    const routerKey = "apps/admin/src/router/index.tsx";
    expect(components[routerKey]).toBeDefined();
    expect(components[routerKey]!.renders).toContain("Route");
    expect(components[routerKey]!.renders).toContain("Switch");
    expect(components[routerKey]!.imports).toContain(
      "apps/admin/src/domains/hospital/containers/HospitalDetailContainer.tsx"
    );
  });
});
