#!/usr/bin/env node
import { Command } from "commander";
import os from "node:os";
import { loadConfig } from "./config.js";
import { runInitCommand } from "./commands/init.js";
import { runIndexCommand } from "./commands/index.js";
import { runAskCommand } from "./commands/ask.js";
import { readCommonFlags } from "./flags.js";

const program = new Command();
program.name("hermes").description("babitalk-front-hermes CLI").version("0.0.0");

program
  .command("init")
  .description("First-time setup: create ~/.hermes/config.json + .env stub")
  .action(async () => {
    const config = loadConfig();
    await runInitCommand({
      homeDir: os.homedir(),
      targetRoot: config.targetRoot,
    });
  });

program
  .command("index")
  .description("Build the static analysis index")
  .option("--force-reindex", "rebuild even if cached")
  .action(async (opts: { forceReindex?: boolean }) => {
    const config = loadConfig();
    await runIndexCommand({
      targetRoot: config.targetRoot,
      ...(opts.forceReindex !== undefined && { force: opts.forceReindex }),
    });
  });

program
  .command("ask")
  .description("Ask a single question")
  .requiredOption("-q, --question <text>", "question text")
  .option("-u, --url <url>", "page URL")
  .option("-i, --image <path>", "screenshot path")
  .option("--verbose")
  .option("--debug")
  .option("--yes-i-know")
  .action(async (opts) => {
    const config = loadConfig();
    const flags = readCommonFlags(opts);
    await runAskCommand({
      targetRoot: config.targetRoot,
      question: opts.question,
      ...(opts.url !== undefined && { url: opts.url }),
      ...(opts.image !== undefined && { imagePath: opts.image }),
      verbose: flags.verbose,
      yesIKnow: flags.yesIKnow,
      model: config.model,
      ...(config.apiKey !== undefined && { apiKey: config.apiKey }),
    });
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
