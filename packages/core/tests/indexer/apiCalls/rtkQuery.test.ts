import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../../src/indexer/project.js";
import { parseRtkQueryApiCalls } from "../../../src/indexer/apiCalls/rtkQuery.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../../tests/fixtures/sample-repo"
);

describe("parseRtkQueryApiCalls", () => {
  it("extracts endpoints from createApi", () => {
    const project = createProject(FIXTURE_ROOT);
    const calls = parseRtkQueryApiCalls(project, FIXTURE_ROOT);
    const get = calls.find((c) => c.id === "hospitalApi.getHospitalById");
    expect(get).toBeDefined();
    expect(get!.method).toBe("GET");
    expect(get!.kind).toBe("rtk-query");
    expect(get!.definedIn).toMatch(/hospitalApi\.ts/);
    const update = calls.find((c) => c.id === "hospitalApi.updateHospital");
    expect(update?.method).toBe("PUT");
  });
});
