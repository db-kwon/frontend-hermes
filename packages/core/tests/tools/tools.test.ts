import { describe, expect, it } from "vitest";
import path from "node:path";
import { buildIndex } from "../../src/indexer/index.js";
import { Retriever } from "../../src/retriever/index.js";
import { TOOL_DEFINITIONS, executeTool } from "../../src/tools/index.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("tools", () => {
  const r = new Retriever(buildIndex(FIXTURE_ROOT));

  it("exposes exactly 6 tool definitions", () => {
    expect(TOOL_DEFINITIONS).toHaveLength(6);
    const names = TOOL_DEFINITIONS.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "find_dependents",
        "find_redux_usage",
        "list_apis_in_component",
        "read_file",
        "route_from_url",
        "search_code",
      ].sort()
    );
  });

  it("executes route_from_url", async () => {
    const result = await executeTool(r, "route_from_url", {
      url: "http://stage.babitalk.com/hospital/9",
    });
    expect(result).toMatchObject({ path: "/hospital/:id", app: "admin" });
  });

  it("executes list_apis_in_component recursively", async () => {
    const result = await executeTool(r, "list_apis_in_component", {
      componentPath:
        "apps/admin/src/domains/hospital/containers/HospitalDetailContainer.tsx",
      recursive: true,
    });
    expect(Array.isArray(result)).toBe(true);
    expect(
      (result as { id: string }[]).some(
        (c) => c.id === "hospitalApi.getHospitalById"
      )
    ).toBe(true);
  });
});
