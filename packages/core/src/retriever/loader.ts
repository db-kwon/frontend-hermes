import fs from "node:fs";
import type { IndexFile } from "../types/indexFile.js";

export function loadIndex(filePath: string): IndexFile {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as IndexFile;
}
