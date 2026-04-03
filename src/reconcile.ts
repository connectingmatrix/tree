import {
  ReconcileTreeWithRetriesInput,
  ReconcileTreeWithRetriesResult,
  TreeNodeRecord,
} from "./types";

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const reconcileTreeWithRetries = async <T extends TreeNodeRecord>(
  input: ReconcileTreeWithRetriesInput<T>
): Promise<ReconcileTreeWithRetriesResult<T>> => {
  const maxAttempts = input.maxAttempts || 8;
  const baseDelayMs = input.baseDelayMs || 300;
  let roots: T[] = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (input.onAttempt) input.onAttempt(attempt);
    roots = await input.fetchRoots();
    if (input.matches(roots))
      return { matched: true, attempts: attempt, roots };
    if (attempt < maxAttempts) await wait(baseDelayMs * attempt);
  }
  return { matched: false, attempts: maxAttempts, roots };
};
