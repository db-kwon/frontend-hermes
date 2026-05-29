import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { ApiCall } from "../../types/apiCall.js";

function literalText(node: Node | undefined): string {
  if (!node) return "";
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node))
    return node.getLiteralText();
  if (Node.isTemplateExpression(node))
    return node.getText().replace(/\$\{[^}]+\}/g, "_PARAM_").slice(1, -1);
  return "";
}

/** A URL we trust is an API path, not some unrelated `url` field. */
function isApiUrl(url: string): boolean {
  return url.startsWith("/") || /^https?:\/\//.test(url);
}

/**
 * Wrapper-style API calls: `apiRequest({ url, method })`, `request({ url })`,
 * etc. — the dominant pattern in the legacy JS apps. We match ANY call whose
 * first argument is an object literal with a string `url` that looks like an
 * API path, regardless of the wrapper's name.
 */
export function parseRequestObjectCalls(
  project: Project,
  root: string
): ApiCall[] {
  const out: ApiCall[] = [];
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    for (const callExpr of sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression
    )) {
      const arg = callExpr.getArguments()[0];
      if (!arg || !Node.isObjectLiteralExpression(arg)) continue;

      const urlProp = arg.getProperty("url");
      if (!urlProp || !Node.isPropertyAssignment(urlProp)) continue;
      const url = literalText(urlProp.getInitializer());
      if (!url || !isApiUrl(url)) continue;

      const methodProp = arg.getProperty("method");
      const method =
        methodProp && Node.isPropertyAssignment(methodProp)
          ? literalText(methodProp.getInitializer()).toUpperCase() || "GET"
          : "GET";

      const line = callExpr.getStartLineNumber();
      out.push({
        id: `request:${rel}:${line}`,
        method,
        url,
        definedIn: `${rel}:${line}`,
        kind: "request",
        usedBy: [rel],
      });
    }
  }
  return out;
}
