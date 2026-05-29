import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runInitCommand } from "../../src/commands/init.js";

describe("runInitCommand", () => {
  it("creates ~/.hermes/config.json + .env stub in target", async () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-home-"));
    const tmpTarget = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-target-"));
    await runInitCommand({
      homeDir: tmpHome,
      targetRoot: tmpTarget,
    });
    expect(fs.existsSync(path.join(tmpHome, ".hermes/config.json"))).toBe(true);
    expect(fs.existsSync(path.join(tmpTarget, ".env.example"))).toBe(true);
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpTarget, { recursive: true, force: true });
  });
});
