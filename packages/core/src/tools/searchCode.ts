import type { Retriever } from "../retriever/index.js";

export async function searchCode(
  retriever: Retriever,
  input: { keyword: string }
): Promise<unknown> {
  return retriever.searchByKeyword(input.keyword);
}
