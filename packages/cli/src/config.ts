import path from "node:path";
import dotenv from "dotenv";

export type ResolvedConfig = {
  targetRoot: string;
  model: string;
  apiKey: string | undefined;
};

export function loadConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  dotenv.config();
  return {
    targetRoot:
      overrides.targetRoot ??
      process.env.HERMES_TARGET_ROOT ??
      path.resolve(process.cwd()),
    model: overrides.model ?? process.env.HERMES_MODEL ?? "claude-sonnet-4-6",
    apiKey: overrides.apiKey ?? process.env.ANTHROPIC_API_KEY,
  };
}
