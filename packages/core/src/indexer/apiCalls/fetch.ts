import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { ApiCall } from "../../types/apiCall.js";

function literalText(node: Node | undefined): string {
  if (!node) return "";
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node))
    return node.getLiteralText();
  if (Node.isTemplateExpression(node))
    return node.getText().replace(/\$\{[^}]+\}/g, "_PARAM_").slice(1, -1);
  return node.getText();
}

export function parseFetchCalls(project: Project, root: string): ApiCall[] {
  const out: ApiCall[] = [];
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    for (const callExpr of sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression
    )) {
      if (callExpr.getExpression().getText() !== "fetch") continue;
      const args = callExpr.getArguments();
      const url = literalText(args[0]);
      if (!url) continue;
      let method = "GET";
      const optsArg = args[1];
      if (optsArg && Node.isObjectLiteralExpression(optsArg)) {
        const m = optsArg.getProperty("method");
        if (m && Node.isPropertyAssignment(m)) {
          method = literalText(m.getInitializer()).toUpperCase() || "GET";
        }
      }
      out.push({
        id: `fetch:${rel}:${callExpr.getStartLineNumber()}`,
        method,
        url,
        definedIn: `${rel}:${callExpr.getStartLineNumber()}`,
        kind: "fetch",
        usedBy: [rel],
      });
    }
  }
  return out;
}
