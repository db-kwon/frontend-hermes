import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import Anthropic from "@anthropic-ai/sdk";
import { Retriever, loadIndex, runAgent } from "@hermes/core";

export type ChatArgs = {
  targetRoot: string;
  url?: string;
  imagePath?: string;
  model: string;
  apiKey: string;
  verbose: boolean;
};

function readImage(p: string) {
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).toLowerCase();
  const mediaType: "image/png" | "image/jpeg" | "image/webp" =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
      ? "image/webp"
      : "image/png";
  return { base64: buf.toString("base64"), mediaType };
}

export async function runChatCommand(args: ChatArgs): Promise<void> {
  const indexPath = path.join(args.targetRoot, ".hermes/index.json");
  if (!fs.existsSync(indexPath))
    throw new Error(`No index at ${indexPath}. Run 'hermes index' first.`);
  const retriever = new Retriever(loadIndex(indexPath));
  const client = new Anthropic({ apiKey: args.apiKey });
  const image = args.imagePath ? readImage(args.imagePath) : undefined;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt("> ");
  rl.prompt();
  rl.on("line", async (line) => {
    const question = line.trim();
    if (!question) {
      rl.prompt();
      return;
    }
    if (question === "/exit" || question === "/quit") {
      rl.close();
      return;
    }
    try {
      const result = await runAgent({
        client,
        retriever,
        model: args.model,
        input: {
          question,
          ...(args.url !== undefined && { url: args.url }),
          ...(image && { imageBase64: image.base64, imageMediaType: image.mediaType }),
        },
        ...(args.verbose && {
          onTrace: (event) => {
            if (event.kind === "tool_use") {
              process.stderr.write(
                `[tool] ${event.name}(${JSON.stringify(event.input)})\n`
              );
            }
          },
        }),
      });
      process.stdout.write(`\n${result.text}\n\n`);
    } catch (err) {
      process.stderr.write(`Error: ${(err as Error).message}\n`);
    }
    rl.prompt();
  });
  await new Promise<void>((resolve) => rl.on("close", () => resolve()));
}
