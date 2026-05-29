import fs from "node:fs";
import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { Route } from "../types/route.js";

const EXT_CANDIDATES = [".tsx", ".ts", ".jsx", ".js"];

function extractAppName(filePath: string, root: string): string | null {
  const rel = path.relative(root, filePath);
  const match = rel.match(/^apps\/([^/]+)\//);
  return match ? (match[1] ?? null) : null;
}

function firstExisting(absNoExt: string, root: string): string | null {
  const candidates = [
    ...EXT_CANDIDATES.map((e) => `${absNoExt}${e}`),
    ...EXT_CANDIDATES.map((e) => path.join(absNoExt, `index${e}`)),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.relative(root, candidate).replace(/\\/g, "/");
    }
  }
  return null;
}

/**
 * Resolve an import to an indexed file path. Handles three forms:
 *  - relative (`./Foo`)
 *  - baseUrl-relative (`components/Foo` with tsconfig `baseUrl: ./src` or `./`)
 * Tries multiple extensions and `index.*` so `.js`/`.jsx` components
 * (legacy apps) resolve too — not just `.tsx`. Bare package imports
 * (`react`, `@scope/pkg`) resolve to nothing and are dropped.
 */
function resolveImport(
  importPath: string,
  fromFile: string,
  root: string
): string | null {
  if (importPath.startsWith(".")) {
    const abs = path.resolve(path.dirname(fromFile), importPath);
    return firstExisting(abs, root);
  }
  // baseUrl-relative: try resolving against the app's src/ then app root.
  const appMatch = fromFile.replace(/\\/g, "/").match(/^(.*\/apps\/[^/]+)\//);
  if (appMatch) {
    const appDir = appMatch[1] as string;
    for (const base of [path.join(appDir, "src"), appDir]) {
      const found = firstExisting(path.join(base, importPath), root);
      if (found) return found;
    }
  }
  return null;
}

/** The component identifier a <Route> renders, from `component=` or `element=`. */
function routeComponentName(jsx: Node): string | null {
  const attrFor = (name: string) =>
    Node.isJsxSelfClosingElement(jsx) || Node.isJsxOpeningElement(jsx)
      ? jsx.getAttribute(name)
      : undefined;

  // v5: component={Foo}
  const componentAttr = attrFor("component");
  if (componentAttr) {
    const expr = componentAttr
      .getFirstDescendantByKind(SyntaxKind.JsxExpression)
      ?.getExpression();
    if (expr && Node.isIdentifier(expr)) return expr.getText();
  }

  // v6: element={<Foo />}
  const elementAttr = attrFor("element");
  if (elementAttr) {
    const inner = elementAttr
      .getFirstDescendantByKind(SyntaxKind.JsxExpression)
      ?.getExpression();
    if (inner) {
      if (Node.isJsxSelfClosingElement(inner))
        return inner.getTagNameNode().getText();
      if (Node.isJsxElement(inner))
        return inner.getOpeningElement().getTagNameNode().getText();
    }
  }

  return null;
}

function routePath(jsx: Node): string | null {
  const pathAttr =
    Node.isJsxSelfClosingElement(jsx) || Node.isJsxOpeningElement(jsx)
      ? jsx.getAttribute("path")
      : undefined;
  const lit = pathAttr?.getFirstDescendantByKind(SyntaxKind.StringLiteral);
  return lit ? lit.getLiteralText() : null;
}

export function parseRoutes(project: Project, root: string): Route[] {
  const routes: Route[] = [];
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const app = extractAppName(filePath, root);
    if (!app) continue;

    const imports = sourceFile.getImportDeclarations();
    const usesRouter = imports.some((imp) =>
      /react-router/.test(imp.getModuleSpecifierValue())
    );
    if (!usesRouter) continue;

    const importMap = new Map<string, string>();
    for (const imp of imports) {
      const resolved = resolveImport(
        imp.getModuleSpecifierValue(),
        filePath,
        root
      );
      if (!resolved) continue;
      const def = imp.getDefaultImport();
      if (def) importMap.set(def.getText(), resolved);
      for (const named of imp.getNamedImports()) {
        importMap.set(named.getName(), resolved);
      }
    }

    // Lazy/dynamic imports: `const Foo = lazy(() => import("path"))` /
    // `retryLazy(() => import("path"))` — common for route code-splitting.
    for (const varDecl of sourceFile.getDescendantsOfKind(
      SyntaxKind.VariableDeclaration
    )) {
      const dynImport = varDecl
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .find((c) => c.getExpression().getKind() === SyntaxKind.ImportKeyword);
      if (!dynImport) continue;
      const spec = dynImport.getArguments()[0];
      if (!spec || !Node.isStringLiteral(spec)) continue;
      const resolved = resolveImport(spec.getLiteralText(), filePath, root);
      if (resolved) importMap.set(varDecl.getName(), resolved);
    }

    const elements: Node[] = [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ];
    for (const jsx of elements) {
      const tag =
        Node.isJsxSelfClosingElement(jsx) || Node.isJsxOpeningElement(jsx)
          ? jsx.getTagNameNode().getText()
          : "";
      if (tag !== "Route") continue;

      const routePathValue = routePath(jsx);
      const componentName = routeComponentName(jsx);
      if (!routePathValue || !componentName) continue;
      const resolved = importMap.get(componentName);
      if (!resolved) continue;
      routes.push({ app, path: routePathValue, componentPath: resolved });
    }
  }
  return routes;
}
