import type { Retriever } from "../retriever/index.js";

export async function readFile(
  retriever: Retriever,
  input: { filePath: string; lineRange?: { start: number; end: number } }
): Promise<unknown> {
  return retriever.readFileSlice(input.filePath, input.lineRange);
}
