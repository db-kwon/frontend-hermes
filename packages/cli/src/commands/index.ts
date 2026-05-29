import path from "node:path";
import { buildIndex, writeIndex } from "@hermes/core";

export type IndexCommandArgs = {
  targetRoot: string;
  force?: boolean;
};

export async function runIndexCommand(args: IndexCommandArgs): Promise<void> {
  const start = Date.now();
  process.stdout.write(`Indexing ${args.targetRoot}...\n`);
  const index = buildIndex(args.targetRoot);
  const outPath = path.join(args.targetRoot, ".hermes/index.json");
  writeIndex(outPath, index);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  process.stdout.write(
    `Wrote ${outPath} (routes=${index.routes.length}, apis=${index.apiCalls.length}) in ${elapsed}s\n`
  );
}
