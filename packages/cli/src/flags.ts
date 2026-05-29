export type CommonFlags = {
  verbose: boolean;
  debug: boolean;
  yesIKnow: boolean;
};

export function readCommonFlags(opts: Record<string, unknown>): CommonFlags {
  return {
    verbose: Boolean(opts.verbose),
    debug: Boolean(opts.debug),
    yesIKnow: Boolean(opts.yesIKnow),
  };
}
