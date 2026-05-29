import { describe, expect, it } from "vitest";
import path from "node:path";
import { buildIndex } from "../../src/indexer/index.js";
import { Retriever } from "../../src/retriever/index.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("Retriever", () => {
  const index = buildIndex(FIXTURE_ROOT);
  const r = new Retriever(index);

  it("matches URL to route", () => {
    const route = r.routeFromUrl("http://stage.babitalk.com/hospital/123");
    expect(route?.path).toBe("/hospital/:id");
  });

  it("lists api calls inside component subtree", () => {
    const route = r.routeFromUrl("http://stage.babitalk.com/hospital/123");
    const calls = r.apiCallsInSubtree(route!.componentPath);
    expect(calls.some((c) => c.id === "hospitalApi.getHospitalById")).toBe(true);
  });

  it("returns dependentsOf for a slice file", () => {
    const deps = r.dependentsOf(
      "apps/admin/src/domains/hospital/api/hospitalApi.ts"
    );
    expect(deps).toContain(
      "apps/admin/src/domains/hospital/containers/HospitalDetailContainer.tsx"
    );
  });

  it("readFileSlice returns file content", () => {
    const text = r.readFileSlice(
      "apps/admin/src/domains/hospital/api/hospitalApi.ts"
    );
    expect(text).toContain("createApi");
  });
});
