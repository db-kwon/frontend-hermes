import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../../src/indexer/project.js";
import { parseApiCalls } from "../../../src/indexer/apiCalls/index.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../../tests/fixtures/sample-repo"
);

describe("parseApiCalls usedBy", () => {
  it("links useXQuery hook usage to endpoint", () => {
    const project = createProject(FIXTURE_ROOT);
    const calls = parseApiCalls(project, FIXTURE_ROOT);
    const get = calls.find((c) => c.id === "hospitalApi.getHospitalById");
    expect(get?.usedBy).toContain(
      "apps/admin/src/domains/hospital/containers/HospitalDetailContainer.tsx"
    );
  });
});
