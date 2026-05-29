import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { ApiCall } from "../../types/apiCall.js";

function literalText(node: Node | undefined): string | null {
  if (!node) return null;
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralText();
  }
  if (Node.isTemplateExpression(node)) {
    return node.getText().replace(/\$\{[^}]+\}/g, "_PARAM_").slice(1, -1);
  }
  return null;
}

/**
 * Unwrap a ParenthesizedExpression to its inner expression.
 */
function unwrapParens(node: Node): Node {
  while (Node.isParenthesizedExpression(node)) {
    node = node.getExpression();
  }
  return node;
}

function inferMethod(builderCall: string, queryBody: Node | undefined): string {
  if (builderCall === "mutation") {
    if (queryBody) {
      const text = queryBody.getText();
      const m = text.match(/method:\s*['"`](\w+)['"`]/);
      if (m) return (m[1] as string).toUpperCase();
    }
    return "POST";
  }
  return "GET";
}

function inferUrl(queryBody: Node | undefined): string {
  if (!queryBody) return "";
  if (Node.isArrowFunction(queryBody) || Node.isFunctionExpression(queryBody)) {
    const rawBody = queryBody.getBody();
    const ret = unwrapParens(rawBody);

    if (Node.isBlock(ret)) {
      const returnStmt = ret.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
      const expr = returnStmt?.getExpression();
      if (expr) {
        const unwrapped = unwrapParens(expr);
        if (Node.isObjectLiteralExpression(unwrapped)) {
          const urlProp = unwrapped.getProperty("url");
          if (urlProp && Node.isPropertyAssignment(urlProp)) {
            return literalText(urlProp.getInitializer()) ?? "";
          }
        }
        return literalText(unwrapped) ?? "";
      }
      return "";
    }

    if (Node.isObjectLiteralExpression(ret)) {
      const urlProp = ret.getProperty("url");
      if (urlProp && Node.isPropertyAssignment(urlProp)) {
        return literalText(urlProp.getInitializer()) ?? "";
      }
    }

    return literalText(ret) ?? "";
  }
  return "";
}

export function parseRtkQueryApiCalls(
  project: Project,
  root: string
): ApiCall[] {
  const out: ApiCall[] = [];
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const relPath = path.relative(root, filePath).replace(/\\/g, "/");

    for (const callExpr of sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression
    )) {
      if (callExpr.getExpression().getText() !== "createApi") continue;
      const arg = callExpr.getArguments()[0];
      if (!arg || !Node.isObjectLiteralExpression(arg)) continue;

      const reducerPathProp = arg.getProperty("reducerPath");
      const reducerPath =
        reducerPathProp && Node.isPropertyAssignment(reducerPathProp)
          ? literalText(reducerPathProp.getInitializer())
          : null;
      const apiNamespace = reducerPath ?? "api";

      const endpointsProp = arg.getProperty("endpoints");
      if (!endpointsProp || !Node.isPropertyAssignment(endpointsProp)) continue;
      const fn = endpointsProp.getInitializer();
      if (
        !fn ||
        !(Node.isArrowFunction(fn) || Node.isFunctionExpression(fn))
      )
        continue;

      const rawBody = fn.getBody();
      let endpointsObj: Node | undefined;

      if (Node.isBlock(rawBody)) {
        endpointsObj = rawBody
          .getFirstDescendantByKind(SyntaxKind.ReturnStatement)
          ?.getExpression();
      } else {
        // Arrow function with concise body: could be `(builder) => ({...})`
        endpointsObj = unwrapParens(rawBody);
      }

      if (!endpointsObj || !Node.isObjectLiteralExpression(endpointsObj))
        continue;

      for (const ep of endpointsObj.getProperties()) {
        if (!Node.isPropertyAssignment(ep)) continue;
        const name = ep.getName();
        const init = ep.getInitializer();
        if (!init) continue;
        const builderCall = init
          .getFirstDescendantByKind(SyntaxKind.PropertyAccessExpression)
          ?.getName();
        const queryProp = init
          .getFirstDescendantByKind(SyntaxKind.ObjectLiteralExpression)
          ?.getProperty("query");
        const queryInit =
          queryProp && Node.isPropertyAssignment(queryProp)
            ? queryProp.getInitializer()
            : undefined;
        out.push({
          id: `${apiNamespace}.${name}`,
          method: inferMethod(builderCall ?? "query", queryInit),
          url: inferUrl(queryInit),
          definedIn: `${relPath}:${ep.getStartLineNumber()}`,
          kind: "rtk-query",
          usedBy: [],
        });
      }
    }
  }
  return out;
}
