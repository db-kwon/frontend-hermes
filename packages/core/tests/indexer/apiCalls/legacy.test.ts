import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../../src/indexer/project.js";
import { parseApiCalls } from "../../../src/indexer/apiCalls/index.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../../tests/fixtures/sample-repo"
);

describe("parseApiCalls — legacy axios/saga", () => {
  it("picks up axios.get inside saga", () => {
    const project = createProject(FIXTURE_ROOT);
    const calls = parseApiCalls(project, FIXTURE_ROOT);
    const axiosCall = calls.find(
      (c) => c.kind === "axios" && c.url.includes("/hospital/")
    );
    expect(axiosCall).toBeDefined();
    expect(axiosCall!.method).toBe("GET");
    expect(axiosCall!.definedIn).toMatch(/hospitalSaga\.ts/);
  });
});
