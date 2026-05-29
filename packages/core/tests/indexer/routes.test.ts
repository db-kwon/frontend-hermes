import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../src/indexer/project.js";
import { parseRoutes } from "../../src/indexer/routes.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("parseRoutes", () => {
  it("extracts react-router 5 Route elements", () => {
    const project = createProject(FIXTURE_ROOT);
    const routes = parseRoutes(project, FIXTURE_ROOT);
    expect(routes).toContainEqual({
      app: "admin",
      path: "/hospital/:id",
      componentPath:
        "apps/admin/src/domains/hospital/containers/HospitalDetailContainer.tsx",
    });
  });

  it("resolves lazy + baseUrl imports in a legacy .js app", () => {
    const project = createProject(FIXTURE_ROOT);
    const routes = parseRoutes(project, FIXTURE_ROOT);
    // const Home = retryLazy(() => import("components/pages/Home"))
    // baseUrl: ./src, resolves to .../Home/index.js
    expect(routes).toContainEqual({
      app: "legacy_client",
      path: "/home",
      componentPath:
        "apps/legacy_client/src/components/pages/Home/index.js",
    });
  });
});
