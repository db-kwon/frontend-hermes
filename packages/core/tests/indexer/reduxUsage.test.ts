import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../src/indexer/project.js";
import { parseReduxUsage } from "../../src/indexer/reduxUsage.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("parseReduxUsage", () => {
  it("extracts slice actions and dispatch sites", () => {
    const project = createProject(FIXTURE_ROOT);
    const usage = parseReduxUsage(project, FIXTURE_ROOT);
    const setHospital = usage.actions.find(
      (a) => a.name === "hospital/setHospital"
    );
    expect(setHospital).toBeDefined();
    expect(setHospital!.dispatchedBy).toContain(
      "apps/admin/src/domains/hospital/containers/HospitalDetailContainer.tsx"
    );
  });
});
