import type { Retriever } from "../retriever/index.js";
import { routeFromUrl } from "./routeFromUrl.js";
import { listApisInComponent } from "./listApisInComponent.js";
import { findDependents } from "./findDependents.js";
import { findReduxUsage } from "./findReduxUsage.js";
import { readFile } from "./readFile.js";
import { searchCode } from "./searchCode.js";

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "route_from_url",
    description:
      "Given a URL, return the matching route and its component path. Returns null if no match.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
  },
  {
    name: "list_apis_in_component",
    description:
      "Lists API calls used by a component file. If recursive=true, walks into imported components.",
    input_schema: {
      type: "object",
      properties: {
        componentPath: { type: "string" },
        recursive: { type: "boolean" },
      },
      required: ["componentPath"],
    },
  },
  {
    name: "find_dependents",
    description:
      "Lists files that import the given file path (reverse import graph).",
    input_schema: {
      type: "object",
      properties: { filePath: { type: "string" } },
      required: ["filePath"],
    },
  },
  {
    name: "find_redux_usage",
    description:
      "For an action name like 'hospital/setHospital', returns definition location and files that dispatch it.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "read_file",
    description:
      "Reads a file (optionally a line range). Path is relative to the analyzed monorepo root.",
    input_schema: {
      type: "object",
      properties: {
        filePath: { type: "string" },
        lineRange: {
          type: "object",
          properties: {
            start: { type: "integer" },
            end: { type: "integer" },
          },
          required: ["start", "end"],
        },
      },
      required: ["filePath"],
    },
  },
  {
    name: "search_code",
    description:
      "Keyword search across indexed files. Returns up to 50 hits with file/line/preview.",
    input_schema: {
      type: "object",
      properties: { keyword: { type: "string" } },
      required: ["keyword"],
    },
  },
];

export async function executeTool(
  retriever: Retriever,
  name: string,
  input: unknown
): Promise<unknown> {
  const typed = input as Record<string, unknown>;
  switch (name) {
    case "route_from_url":
      return routeFromUrl(retriever, typed as { url: string });
    case "list_apis_in_component":
      return listApisInComponent(
        retriever,
        typed as { componentPath: string; recursive?: boolean }
      );
    case "find_dependents":
      return findDependents(retriever, typed as { filePath: string });
    case "find_redux_usage":
      return findReduxUsage(retriever, typed as { name: string });
    case "read_file":
      return readFile(
        retriever,
        typed as {
          filePath: string;
          lineRange?: { start: number; end: number };
        }
      );
    case "search_code":
      return searchCode(retriever, typed as { keyword: string });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
