import fs from "node:fs";
import path from "node:path";
import type { IndexFile } from "../types/indexFile.js";
import type { Route } from "../types/route.js";
import type { ApiCall } from "../types/apiCall.js";
import type { ReduxAction } from "../types/reduxUsage.js";

export type SearchHit = {
  file: string;
  line: number;
  preview: string;
};

export class Retriever {
  constructor(private readonly index: IndexFile) {}

  routeFromUrl(url: string): Route | null {
    const u = new URL(url, "http://placeholder");
    const pathname = u.pathname;
    for (const route of this.index.routes) {
      const pattern = route.path.replace(/:[^/]+/g, "([^/]+)");
      const re = new RegExp(`^${pattern}/?$`);
      if (re.test(pathname)) return route;
    }
    return null;
  }

  apiCallsInComponent(componentPath: string): ApiCall[] {
    return this.index.apiCalls.filter((c) =>
      c.usedBy.includes(componentPath)
    );
  }

  apiCallsInSubtree(rootComponent: string): ApiCall[] {
    const visited = new Set<string>();
    const queue = [rootComponent];
    const result = new Map<string, ApiCall>();
    while (queue.length) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const call of this.apiCallsInComponent(cur)) {
        result.set(call.id, call);
      }
      const node = this.index.components[cur];
      if (node) {
        for (const imp of node.imports) queue.push(imp);
      }
    }
    return [...result.values()];
  }

  dependentsOf(filePath: string): string[] {
    const node = this.index.fileGraph[filePath];
    return node?.importedBy ?? [];
  }

  reduxUsageOf(name: string): { action?: ReduxAction } {
    const action = this.index.reduxUsage.actions.find((a) => a.name === name);
    return action ? { action } : {};
  }

  searchByKeyword(keyword: string): SearchHit[] {
    const hits: SearchHit[] = [];
    const needle = keyword.toLowerCase();
    for (const filePath of Object.keys(this.index.fileGraph)) {
      const abs = path.join(this.index.monorepoRoot, filePath);
      if (!fs.existsSync(abs)) continue;
      const lines = fs.readFileSync(abs, "utf-8").split("\n");
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(needle)) {
          hits.push({
            file: filePath,
            line: idx + 1,
            preview: line.trim().slice(0, 200),
          });
        }
      });
      if (hits.length >= 50) break;
    }
    return hits.slice(0, 50);
  }

  readFileSlice(
    filePath: string,
    range?: { start: number; end: number }
  ): string {
    const abs = path.join(this.index.monorepoRoot, filePath);
    const text = fs.readFileSync(abs, "utf-8");
    if (!range) return text.slice(0, 100_000);
    const lines = text.split("\n");
    return lines.slice(range.start - 1, range.end).join("\n");
  }
}

export { loadIndex } from "./loader.js";
