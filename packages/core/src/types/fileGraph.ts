export type FileNode = {
  imports: string[];
  importedBy: string[];
};

export type FileGraph = Record<string, FileNode>;
