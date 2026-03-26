import { describe, expect, it } from 'vitest';
import { reconcileTreeWithRetries } from '../reconcile';
import { TreeNode } from '../types';

const makeRoot = (id: string): TreeNode => ({
    id,
    scope: 'u',
    nodeType: 'channel',
    name: id,
    slug: id,
    description: '',
    url: `/u/channel/${id}`,
    parentId: null,
    depth: 0,
    pathSegments: [{ type: 'channel', slug: id, id, label: id }],
    posts: [],
    children: []
});

describe('reconcileTreeWithRetries', () => {
    it('retries until match and returns final roots', async () => {
        let count = 0;

        const result = await reconcileTreeWithRetries({
            fetchRoots: async () => {
                count += 1;
                return count < 3 ? [makeRoot('a')] : [makeRoot('b')];
            },
            matches: (roots) => roots[0]?.id === 'b',
            maxAttempts: 4,
            baseDelayMs: 1
        });

        expect(result.matched).toBe(true);
        expect(result.attempts).toBe(3);
        expect(result.roots[0]?.id).toBe('b');
    });
});
