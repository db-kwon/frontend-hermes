#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { runIndexCommand } from "./commands/index.js";

const program = new Command();
program.name("hermes").description("babitalk-front-hermes CLI").version("0.0.0");

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

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
