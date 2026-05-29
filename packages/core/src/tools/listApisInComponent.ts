import type { Retriever } from "../retriever/index.js";

export async function listApisInComponent(
  retriever: Retriever,
  input: { componentPath: string; recursive?: boolean }
): Promise<unknown> {
  if (input.recursive) {
    return retriever.apiCallsInSubtree(input.componentPath);
  }
  return retriever.apiCallsInComponent(input.componentPath);
}
