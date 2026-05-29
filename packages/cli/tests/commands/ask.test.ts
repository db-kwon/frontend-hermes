import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildIndex, writeIndex } from "@hermes/core";
import { runAskCommand } from "../../src/commands/ask.js";

const FIXTURE_ROOT = path.resolve(
  __dirname,
  "../../../../tests/fixtures/sample-repo"
);

describe("runAskCommand", () => {
  it("runs the agent loop using a fake client and prints text", async () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-ask-"));
    fs.cpSync(FIXTURE_ROOT, tmpRoot, { recursive: true });
    const index = buildIndex(tmpRoot);
    writeIndex(path.join(tmpRoot, ".hermes/index.json"), index);

    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runAskCommand({
      targetRoot: tmpRoot,
      question: "이 페이지에서 부르는 API",
      url: "http://stage.babitalk.com/hospital/9",
      verbose: false,
      yesIKnow: false,
      clientFactory: () =>
        ({
          messages: {
            create: vi.fn(async () => ({
              stop_reason: "end_turn",
              content: [{ type: "text", text: "## 답변\nOK" }],
            })),
          },
        } as any),
      model: "claude-sonnet-4-6",
    });
    expect(
      stdout.mock.calls.some(([s]) => String(s).includes("## 답변"))
    ).toBe(true);
    stdout.mockRestore();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });
});
