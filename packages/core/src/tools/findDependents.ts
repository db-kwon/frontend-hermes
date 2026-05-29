import type { Retriever } from "../retriever/index.js";

export async function findDependents(
  retriever: Retriever,
  input: { filePath: string }
): Promise<unknown> {
  return retriever.dependentsOf(input.filePath);
}
