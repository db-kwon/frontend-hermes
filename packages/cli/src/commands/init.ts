import fs from "node:fs";
import path from "node:path";

export type InitArgs = { homeDir: string; targetRoot: string };

const ENV_TEMPLATE = `ANTHROPIC_API_KEY=
HERMES_MODEL=claude-sonnet-4-6
HERMES_TARGET_ROOT=
`;

export async function runInitCommand(args: InitArgs): Promise<void> {
  const cfgDir = path.join(args.homeDir, ".hermes");
  fs.mkdirSync(cfgDir, { recursive: true });
  const cfgPath = path.join(cfgDir, "config.json");
  if (!fs.existsSync(cfgPath)) {
    fs.writeFileSync(
      cfgPath,
      JSON.stringify(
        { model: "claude-sonnet-4-6", lastTargetRoot: args.targetRoot },
        null,
        2
      )
    );
  }
  const envPath = path.join(args.targetRoot, ".env.example");
  if (!fs.existsSync(envPath)) fs.writeFileSync(envPath, ENV_TEMPLATE);
  process.stdout.write(`Wrote ${cfgPath}\nWrote ${envPath}\n`);
  process.stdout.write(
    "Next: copy .env.example to .env and fill ANTHROPIC_API_KEY.\n"
  );
}
