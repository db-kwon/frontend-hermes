import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { Retriever, buildIndex, runAgent } from "@hermes/core";

type Golden = {
  id: string;
  url: string | null;
  question: string;
  expectedSubstrings: string[];
};

const FIXTURE_ROOT = path.resolve(
  process.cwd(),
  "tests/fixtures/sample-repo"
);

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY required");

  const goldens: Golden[] = JSON.parse(
    fs.readFileSync("tests/golden/questions.json", "utf-8")
  );
  const retriever = new Retriever(buildIndex(FIXTURE_ROOT));
  const client = new Anthropic({ apiKey });

  let pass = 0;
  for (const g of goldens) {
    const result = await runAgent({
      client,
      retriever,
      model: process.env.HERMES_MODEL ?? "claude-sonnet-4-6",
      input: { question: g.question, ...(g.url !== null && { url: g.url }) },
    });
    const missing = g.expectedSubstrings.filter(
      (s) => !result.text.includes(s)
    );
    const ok = missing.length === 0;
    if (ok) pass++;
    process.stdout.write(
      `${ok ? "PASS" : "FAIL"} ${g.id}${ok ? "" : ` (missing: ${missing.join(", ")})`}\n`
    );
  }
  process.stdout.write(`\n${pass}/${goldens.length} passed\n`);
  if (pass < goldens.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
