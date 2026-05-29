export type ComponentNode = {
  imports: string[];
  renders: string[];
};

export type ComponentMap = Record<string, ComponentNode>;
