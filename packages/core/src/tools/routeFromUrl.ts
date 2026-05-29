import type { Retriever } from "../retriever/index.js";

export async function routeFromUrl(
  retriever: Retriever,
  input: { url: string }
): Promise<unknown> {
  return retriever.routeFromUrl(input.url);
}
