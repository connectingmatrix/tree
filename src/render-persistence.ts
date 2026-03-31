import { TreeSelection, StorageLike } from './types';

export interface TreeRenderState {
    activeContextKey: string;
    expandedKeysByContext: Record<string, string[]>;
    selectedByContext: Record<string, TreeSelection>;
}

export const TREE_RENDER_STATE_STORAGE_KEY = 'giga_tree_render_state_v2';

export const createTreeRenderState = (): TreeRenderState => ({
    activeContextKey: 'user',
    expandedKeysByContext: { user: ['group-u'] },
    selectedByContext: {}
});

export const readTreeRenderState = (storage: StorageLike | null | undefined, storageKey: string = TREE_RENDER_STATE_STORAGE_KEY): TreeRenderState => {
    if (!storage) {
        return createTreeRenderState();
    }

    try {
        const value = storage.getItem(storageKey);
        if (!value) {
            return createTreeRenderState();
        }
        const parsed = JSON.parse(value) as TreeRenderState;
        return {
            activeContextKey: parsed.activeContextKey || 'user',
            expandedKeysByContext: parsed.expandedKeysByContext || { user: ['group-u'] },
            selectedByContext: parsed.selectedByContext || {}
        };
    } catch {
        return createTreeRenderState();
    }
};

export const persistTreeRenderState = (storage: StorageLike | null | undefined, state: TreeRenderState, storageKey: string = TREE_RENDER_STATE_STORAGE_KEY): void => {
    if (!storage) {
        return;
    }

    try {
        storage.setItem(storageKey, JSON.stringify(state));
    } catch {
        return;
    }
};
