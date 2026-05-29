import path from "node:path";
import { Project, SyntaxKind } from "ts-morph";
import type { ApiCall } from "../../types/apiCall.js";
import { parseRtkQueryApiCalls } from "./rtkQuery.js";

function hookName(endpointName: string, kind: "query" | "mutation"): string {
  const cap = endpointName.charAt(0).toUpperCase() + endpointName.slice(1);
  return `use${cap}${kind === "query" ? "Query" : "Mutation"}`;
}

export function parseApiCalls(project: Project, root: string): ApiCall[] {
  const calls = parseRtkQueryApiCalls(project, root);
  const byHook = new Map<string, ApiCall[]>();
  for (const call of calls) {
    const epName = call.id.split(".").pop()!;
    const queryHook = hookName(epName, "query");
    const mutationHook = hookName(epName, "mutation");
    for (const hook of [queryHook, mutationHook]) {
      const arr = byHook.get(hook) ?? [];
      arr.push(call);
      byHook.set(hook, arr);
    }
  }
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const matches = byHook.get(id.getText());
      if (!matches) continue;
      for (const call of matches) {
        if (!call.usedBy.includes(rel)) call.usedBy.push(rel);
      }
    }
  }
  return calls;
}
