import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { ApiCall } from "../../types/apiCall.js";

const AXIOS_METHODS = new Set(["get", "post", "put", "delete", "patch"]);

function literalText(node: Node | undefined): string {
  if (!node) return "";
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node))
    return node.getLiteralText();
  if (Node.isTemplateExpression(node))
    return node.getText().replace(/\$\{[^}]+\}/g, "_PARAM_").slice(1, -1);
  return node.getText();
}

export function parseAxiosCalls(project: Project, root: string): ApiCall[] {
  const out: ApiCall[] = [];
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    for (const callExpr of sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression
    )) {
      const expr = callExpr.getExpression();

      // Pattern 1: direct axios.get(url)
      if (Node.isPropertyAccessExpression(expr)) {
        const obj = expr.getExpression().getText();
        const method = expr.getName();
        if (obj === "axios" && AXIOS_METHODS.has(method)) {
          const url = literalText(callExpr.getArguments()[0]);
          if (!url) continue;
          out.push({
            id: `axios:${rel}:${callExpr.getStartLineNumber()}`,
            method: method.toUpperCase(),
            url,
            definedIn: `${rel}:${callExpr.getStartLineNumber()}`,
            kind: "axios",
            usedBy: [rel],
          });
          continue;
        }
      }

      // Pattern 2: saga-style call(axios.get, url)
      // call(axios.method, url, ...) — first arg is axios.method reference
      const args = callExpr.getArguments();
      if (args.length >= 2) {
        const firstArg = args[0];
        if (
          Node.isPropertyAccessExpression(firstArg) &&
          firstArg.getExpression().getText() === "axios" &&
          AXIOS_METHODS.has(firstArg.getName())
        ) {
          const method = firstArg.getName();
          const url = literalText(args[1]);
          if (!url) continue;
          out.push({
            id: `axios:${rel}:${callExpr.getStartLineNumber()}`,
            method: method.toUpperCase(),
            url,
            definedIn: `${rel}:${callExpr.getStartLineNumber()}`,
            kind: "axios",
            usedBy: [rel],
          });
        }
      }
    }
  }
  return out;
}
