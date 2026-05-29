export type ReduxAction = {
  name: string;
  definedIn: string;
  dispatchedBy: string[];
};

export type ReduxSelector = {
  name: string;
  definedIn: string;
  usedBy: string[];
};

export type ReduxUsage = {
  actions: ReduxAction[];
  selectors: ReduxSelector[];
};
