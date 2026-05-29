import path from "node:path";
import { Project, SyntaxKind } from "ts-morph";
import type { ComponentMap } from "../types/component.js";

function resolveRelativeImport(
  importPath: string,
  fromFile: string,
  root: string
): string | null {
  if (!importPath.startsWith(".")) return null;
  const abs = path.resolve(path.dirname(fromFile), importPath);
  return path.relative(root, `${abs}.tsx`).replace(/\\/g, "/");
}

export function parseComponents(project: Project, root: string): ComponentMap {
  const out: ComponentMap = {};
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    if (!filePath.endsWith(".tsx")) continue;
    const key = path.relative(root, filePath).replace(/\\/g, "/");

    const imports: string[] = [];
    for (const imp of sourceFile.getImportDeclarations()) {
      const resolved = resolveRelativeImport(
        imp.getModuleSpecifierValue(),
        filePath,
        root
      );
      if (resolved) imports.push(resolved);
    }

    const renders = new Set<string>();
    for (const jsx of sourceFile.getDescendantsOfKind(
      SyntaxKind.JsxOpeningElement
    )) {
      renders.add(jsx.getTagNameNode().getText());
    }
    for (const jsx of sourceFile.getDescendantsOfKind(
      SyntaxKind.JsxSelfClosingElement
    )) {
      renders.add(jsx.getTagNameNode().getText());
    }

    out[key] = { imports, renders: [...renders] };
  }
  return out;
}
