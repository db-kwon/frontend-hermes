import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runIndexCommand } from "../../src/commands/index.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("runIndexCommand", () => {
  it("writes .hermes/index.json into target root", async () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-cli-"));
    fs.cpSync(FIXTURE_ROOT, tmpRoot, { recursive: true });
    await runIndexCommand({ targetRoot: tmpRoot });
    const out = path.join(tmpRoot, ".hermes/index.json");
    expect(fs.existsSync(out)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(out, "utf-8"));
    expect(parsed.version).toBe("1");
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });
});
