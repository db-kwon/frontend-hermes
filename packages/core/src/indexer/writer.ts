import fs from "node:fs";
import path from "node:path";
import type { IndexFile } from "../types/indexFile.js";

export function writeIndex(filePath: string, index: IndexFile): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(index, null, 2), "utf-8");
}
