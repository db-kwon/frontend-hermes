import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../src/indexer/project.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("createProject", () => {
  it("loads source files from monorepo apps", () => {
    const project = createProject(FIXTURE_ROOT);
    const files = project
      .getSourceFiles()
      .map((sf) => path.relative(FIXTURE_ROOT, sf.getFilePath()));
    expect(files).toContain("apps/admin/src/router/index.tsx");
    expect(files).toContain(
      "apps/admin/src/domains/hospital/api/hospitalApi.ts"
    );
  });
});
