import { ReconcileTreeWithRetriesInput, ReconcileTreeWithRetriesResult, TreeNode } from './types';

const waitFor = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

export const reconcileTreeWithRetries = async (input: ReconcileTreeWithRetriesInput): Promise<ReconcileTreeWithRetriesResult> => {
    const maxAttempts = input.maxAttempts ?? 8;
    const baseDelayMs = input.baseDelayMs ?? 300;

    let roots: TreeNode[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        input.onAttempt?.(attempt);
        roots = await input.fetchRoots();

        if (input.matches(roots)) {
            return {
                matched: true,
                attempts: attempt,
                roots
            };
        }

        if (attempt < maxAttempts) {
            await waitFor(baseDelayMs * attempt);
        }
    }

    return {
        matched: false,
        attempts: maxAttempts,
        roots
    };
};
