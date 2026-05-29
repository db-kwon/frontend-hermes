import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { Route } from "../types/route.js";

function extractAppName(filePath: string, root: string): string | null {
  const rel = path.relative(root, filePath);
  const match = rel.match(/^apps\/([^/]+)\//);
  return match ? (match[1] ?? null) : null;
}

function resolveImport(
  importPath: string,
  fromFile: string,
  root: string
): string | null {
  if (!importPath.startsWith(".")) return null;
  const abs = path.resolve(path.dirname(fromFile), importPath);
  const candidates = [
    `${abs}.tsx`,
    `${abs}.ts`,
    `${abs}/index.tsx`,
    `${abs}/index.ts`,
  ];
  for (const c of candidates) {
    return path.relative(root, c).replace(/\\/g, "/");
  }
  return null;
}

export function parseRoutes(project: Project, root: string): Route[] {
  const routes: Route[] = [];
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    if (!/router/i.test(filePath)) continue;
    const app = extractAppName(filePath, root);
    if (!app) continue;

    const importMap = new Map<string, string>();
    for (const imp of sourceFile.getImportDeclarations()) {
      const moduleSpec = imp.getModuleSpecifierValue();
      const resolved = resolveImport(moduleSpec, filePath, root);
      if (!resolved) continue;
      const def = imp.getDefaultImport();
      if (def) importMap.set(def.getText(), resolved);
      for (const named of imp.getNamedImports()) {
        importMap.set(named.getName(), resolved);
      }
    }

    for (const jsx of sourceFile.getDescendantsOfKind(
      SyntaxKind.JsxSelfClosingElement
    )) {
      const tag = jsx.getTagNameNode().getText();
      if (tag !== "Route") continue;
      const pathAttr = jsx.getAttribute("path");
      const componentAttr = jsx.getAttribute("component");
      if (!pathAttr || !componentAttr) continue;
      const pathLit = pathAttr.getFirstDescendantByKind(SyntaxKind.StringLiteral);
      if (!pathLit) continue;
      const componentExpr = componentAttr.getFirstDescendantByKind(
        SyntaxKind.JsxExpression
      );
      if (!componentExpr) continue;
      const inner = componentExpr.getExpression();
      if (!inner || !Node.isIdentifier(inner)) continue;
      const resolved = importMap.get(inner.getText());
      if (!resolved) continue;
      routes.push({
        app,
        path: pathLit.getLiteralText(),
        componentPath: resolved,
      });
    }
  }
  return routes;
}
