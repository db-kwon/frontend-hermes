const HEURISTIC_CHARS_PER_TOKEN = 4;
export const INPUT_TOKEN_WARN = 50_000;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / HEURISTIC_CHARS_PER_TOKEN);
}

export function assertWithinBudget(
  estimatedTokens: number,
  yesIKnow: boolean
): void {
  if (estimatedTokens > INPUT_TOKEN_WARN && !yesIKnow) {
    throw new Error(
      `Estimated input tokens (${estimatedTokens}) > ${INPUT_TOKEN_WARN}. Re-run with --yes-i-know to proceed.`
    );
  }
}
