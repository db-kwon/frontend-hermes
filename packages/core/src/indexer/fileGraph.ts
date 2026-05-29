import path from "node:path";
import * as fs from "node:fs";
import { Project } from "ts-morph";
import type { FileGraph } from "../types/fileGraph.js";

function resolveImport(
  importPath: string,
  fromFile: string,
  root: string
): string | null {
  if (!importPath.startsWith(".")) return null;
  const abs = path.resolve(path.dirname(fromFile), importPath);
  // Check filesystem to pick the correct extension.
  for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    const candidate = `${abs}${ext}`;
    if (fs.existsSync(candidate)) {
      return path.relative(root, candidate).replace(/\\/g, "/");
    }
  }
  // Fallback to .ts (most common case for non-component modules).
  return path.relative(root, `${abs}.ts`).replace(/\\/g, "/");
}

export function buildFileGraph(project: Project, root: string): FileGraph {
  const graph: FileGraph = {};
  const ensure = (key: string) => {
    if (!graph[key]) graph[key] = { imports: [], importedBy: [] };
    return graph[key]!;
  };

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const key = path.relative(root, filePath).replace(/\\/g, "/");
    const node = ensure(key);
    for (const imp of sourceFile.getImportDeclarations()) {
      const resolved = resolveImport(
        imp.getModuleSpecifierValue(),
        filePath,
        root
      );
      if (!resolved) continue;
      node.imports.push(resolved);
      ensure(resolved).importedBy.push(key);
    }
  }
  return graph;
}
