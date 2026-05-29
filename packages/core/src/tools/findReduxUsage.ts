import type { Retriever } from "../retriever/index.js";

export async function findReduxUsage(
  retriever: Retriever,
  input: { name: string }
): Promise<unknown> {
  return retriever.reduxUsageOf(input.name);
}
