import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildIndex } from "../../src/indexer/index.js";
import { writeIndex } from "../../src/indexer/writer.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("buildIndex + writeIndex", () => {
  it("produces a JSON file with all 5 sections", () => {
    const index = buildIndex(FIXTURE_ROOT);
    expect(index.version).toBe("1");
    expect(index.apps).toContain("admin");
    expect(index.routes.length).toBeGreaterThan(0);
    expect(Object.keys(index.components).length).toBeGreaterThan(0);
    expect(index.apiCalls.length).toBeGreaterThan(0);

    const tmp = path.join(os.tmpdir(), `hermes-test-${Date.now()}.json`);
    writeIndex(tmp, index);
    const parsed = JSON.parse(fs.readFileSync(tmp, "utf-8"));
    expect(parsed.version).toBe("1");
    fs.unlinkSync(tmp);
  });
});
