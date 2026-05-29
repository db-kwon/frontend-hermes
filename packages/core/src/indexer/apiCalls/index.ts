import path from "node:path";
import { Project, SyntaxKind } from "ts-morph";
import type { ApiCall } from "../../types/apiCall.js";
import { parseRtkQueryApiCalls } from "./rtkQuery.js";
import { parseAxiosCalls } from "./axios.js";
import { parseFetchCalls } from "./fetch.js";
import { parseSagaCalls } from "./saga.js";
import { parseRequestObjectCalls } from "./requestObject.js";

function hookName(endpointName: string, kind: "query" | "mutation"): string {
  const cap = endpointName.charAt(0).toUpperCase() + endpointName.slice(1);
  return `use${cap}${kind === "query" ? "Query" : "Mutation"}`;
}

export function parseApiCalls(project: Project, root: string): ApiCall[] {
  const rtk = parseRtkQueryApiCalls(project, root);
  const ax = parseAxiosCalls(project, root);
  const ft = parseFetchCalls(project, root);
  const sg = parseSagaCalls(project, root);
  const req = parseRequestObjectCalls(project, root);
  const calls = [...rtk, ...ax, ...ft, ...sg, ...req];

  const byHook = new Map<string, ApiCall[]>();
  for (const call of rtk) {
    const epName = call.id.split(".").pop()!;
    for (const hook of [hookName(epName, "query"), hookName(epName, "mutation")]) {
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
