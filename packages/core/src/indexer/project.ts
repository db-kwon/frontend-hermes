import path from "node:path";
import { Project, ScriptTarget, ModuleKind, ts } from "ts-morph";

export function createProject(monorepoRoot: string): Project {
  const project = new Project({
    useInMemoryFileSystem: false,
    compilerOptions: {
      target: ScriptTarget.ES2022,
      module: ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      strict: false,
      noEmit: true,
      allowJs: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  });

  project.addSourceFilesAtPaths([
    path.join(monorepoRoot, "apps/*/src/**/*.{ts,tsx}"),
    path.join(monorepoRoot, "packages/*/src/**/*.{ts,tsx}"),
    `!${path.join(monorepoRoot, "**/node_modules/**")}`,
    `!${path.join(monorepoRoot, "**/dist/**")}`,
    `!${path.join(monorepoRoot, "**/build/**")}`,
  ]);

  return project;
}
