import { describe, expect, it } from "vitest";
import path from "node:path";
import { createProject } from "../../../src/indexer/project.js";
import { parseRequestObjectCalls } from "../../../src/indexer/apiCalls/requestObject.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../../tests/fixtures/sample-repo"
);

describe("parseRequestObjectCalls", () => {
  it("captures wrapper(obj) calls with a url + method", () => {
    const project = createProject(FIXTURE_ROOT);
    const calls = parseRequestObjectCalls(project, FIXTURE_ROOT);
    // getDashboard = () => apiRequest({ url: "/dashboard/v2/summary/", method: "GET" })
    const hit = calls.find((c) => c.url === "/dashboard/v2/summary/");
    expect(hit).toBeDefined();
    expect(hit?.method).toBe("GET");
    expect(hit?.kind).toBe("request");
    expect(hit?.definedIn).toContain(
      "apps/legacy_client/src/components/pages/Home/index.js"
    );
  });

  it("ignores object args whose url is not an API path", () => {
    const project = createProject(FIXTURE_ROOT);
    const calls = parseRequestObjectCalls(project, FIXTURE_ROOT);
    // No fixture object uses a non-API url; guard against accidental matches.
    expect(calls.every((c) => /^(\/|https?:\/\/)/.test(c.url))).toBe(true);
  });
});
