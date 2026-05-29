import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { Retriever, loadIndex, runAgent } from "@hermes/core";
import { assertWithinBudget, estimateTokens } from "../costGuard.js";

export type AskArgs = {
  targetRoot: string;
  question: string;
  url?: string;
  imagePath?: string;
  verbose: boolean;
  yesIKnow: boolean;
  model: string;
  apiKey?: string;
  clientFactory?: (apiKey: string) => Anthropic;
};

function readImage(
  p: string
): { base64: string; mediaType: "image/png" | "image/jpeg" | "image/webp" } {
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).toLowerCase();
  const mediaType =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
      ? "image/webp"
      : "image/png";
  return { base64: buf.toString("base64"), mediaType };
}

export async function runAskCommand(args: AskArgs): Promise<void> {
  const indexPath = path.join(args.targetRoot, ".hermes/index.json");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`No index at ${indexPath}. Run 'hermes index' first.`);
  }
  const index = loadIndex(indexPath);
  const retriever = new Retriever(index);

  const estInput =
    estimateTokens(args.question) +
    (args.imagePath ? 1500 : 0) +
    (args.url ? 50 : 0);
  assertWithinBudget(estInput, args.yesIKnow);

  const apiKey = args.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
  const client =
    args.clientFactory?.(apiKey) ?? new Anthropic({ apiKey });

  const image = args.imagePath ? readImage(args.imagePath) : undefined;

  type TraceEvent =
    | { kind: "tool_use"; name: string; input: unknown }
    | { kind: "tool_result"; name: string; result: unknown }
    | { kind: "text"; text: string };

  const onTrace = args.verbose
    ? (event: TraceEvent) => {
        if (event.kind === "tool_use") {
          process.stderr.write(
            `[tool] ${event.name}(${JSON.stringify(event.input)})\n`
          );
        }
      }
    : undefined;

  const result = await runAgent({
    client,
    retriever,
    model: args.model,
    input: {
      question: args.question,
      ...(args.url !== undefined && { url: args.url }),
      ...(image && { imageBase64: image.base64, imageMediaType: image.mediaType }),
    },
    ...(onTrace !== undefined && { onTrace }),
  });

  process.stdout.write(`${result.text}\n`);
}
