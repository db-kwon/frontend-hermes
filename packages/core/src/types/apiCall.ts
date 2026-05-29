export type ApiCallKind = "rtk-query" | "saga" | "axios" | "fetch";

export type ApiCall = {
  id: string;
  method: string;
  url: string;
  definedIn: string;
  kind: ApiCallKind;
  usedBy: string[];
};
