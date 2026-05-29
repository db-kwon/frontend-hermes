import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { ReduxAction, ReduxUsage } from "../types/reduxUsage.js";

export function parseReduxUsage(project: Project, root: string): ReduxUsage {
  const actions: ReduxAction[] = [];
  const actionsByExported = new Map<string, ReduxAction>();

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const rel = path.relative(root, filePath).replace(/\\/g, "/");

    for (const callExpr of sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression
    )) {
      if (callExpr.getExpression().getText() !== "createSlice") continue;
      const arg = callExpr.getArguments()[0];
      if (!arg || !Node.isObjectLiteralExpression(arg)) continue;

      const nameProp = arg.getProperty("name");
      const sliceName =
        nameProp && Node.isPropertyAssignment(nameProp)
          ? (nameProp.getInitializer()?.getText() ?? "").replace(/['"`]/g, "")
          : "slice";

      const reducersProp = arg.getProperty("reducers");
      if (!reducersProp || !Node.isPropertyAssignment(reducersProp)) continue;
      const reducersObj = reducersProp.getInitializer();
      if (!reducersObj || !Node.isObjectLiteralExpression(reducersObj)) continue;

      for (const reducer of reducersObj.getProperties()) {
        if (!Node.isPropertyAssignment(reducer) && !Node.isMethodDeclaration(reducer))
          continue;
        const name = (reducer as { getName: () => string }).getName();
        const action: ReduxAction = {
          name: `${sliceName}/${name}`,
          definedIn: `${rel}:${reducer.getStartLineNumber()}`,
          dispatchedBy: [],
        };
        actions.push(action);
        actionsByExported.set(name, action);
      }
    }
  }

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const action = actionsByExported.get(id.getText());
      if (!action) continue;
      const parent = id.getParent();
      if (parent && Node.isCallExpression(parent)) {
        const callee = parent.getExpression().getText();
        if (callee === "dispatch" || callee.endsWith(".dispatch")) {
          if (!action.dispatchedBy.includes(rel))
            action.dispatchedBy.push(rel);
          continue;
        }
      }
      const grandparent = parent?.getParent();
      if (grandparent && Node.isCallExpression(grandparent)) {
        const callee = grandparent.getExpression().getText();
        if (callee === "dispatch" || callee.endsWith(".dispatch")) {
          if (!action.dispatchedBy.includes(rel))
            action.dispatchedBy.push(rel);
        }
      }
    }
  }

  return { actions, selectors: [] };
}
