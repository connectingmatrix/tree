// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTreeRenderState, readTreeRenderState } from '../render-persistence';
import { StorageLike } from '../types';

const createMemoryStorage = (seed?: string): StorageLike => {
    let value = seed || null;
    return {
        getItem: () => value,
        setItem: (_key: string, nextValue: string) => {
            value = nextValue;
        }
    };
};

describe('render persistence', () => {
    it('falls back to default render state', () => {
        expect(readTreeRenderState(createMemoryStorage('{broken-json'))).toEqual(createTreeRenderState());
    });

    it('reads stored active context and selected node', () => {
        const state = readTreeRenderState(
            createMemoryStorage(
                JSON.stringify({
                    activeContextKey: 'organization:org-1',
                    expandedKeysByContext: { 'organization:org-1': ['group-org-1'] },
                    selectedByContext: { 'organization:org-1': { id: 'channel-1', nodeType: 'channel', treeContextKey: 'organization:org-1', scope: 'u' } }
                })
            )
        );

        expect(state.activeContextKey).toBe('organization:org-1');
        expect(state.selectedByContext['organization:org-1']?.id).toBe('channel-1');
    });
});
