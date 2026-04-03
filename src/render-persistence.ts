import { StorageLike, TreeSelection } from "./types";

export interface TreeRenderState {
  activeContextKey: string;
  expandedKeysByContext: Record<string, string[]>;
  selectedByContext: Record<string, TreeSelection | undefined>;
}

export const TREE_RENDER_STATE_STORAGE_KEY =
  "connectingmatrix_tree_render_state_v1";

export const createTreeRenderState = (
  activeContextKey: string = "default"
): TreeRenderState => ({
  activeContextKey,
  expandedKeysByContext: {},
  selectedByContext: {},
});

export const readTreeRenderState = (
  storage: StorageLike | null | undefined,
  activeContextKey: string = "default",
  storageKey: string = TREE_RENDER_STATE_STORAGE_KEY
): TreeRenderState => {
  if (!storage) return createTreeRenderState(activeContextKey);
  try {
    const value = storage.getItem(storageKey);
    if (!value) return createTreeRenderState(activeContextKey);
    const parsed = JSON.parse(value) as TreeRenderState;
    return {
      activeContextKey: parsed.activeContextKey || activeContextKey,
      expandedKeysByContext: parsed.expandedKeysByContext || {},
      selectedByContext: parsed.selectedByContext || {},
    };
  } catch {
    return createTreeRenderState(activeContextKey);
  }
};

export const persistTreeRenderState = (
  storage: StorageLike | null | undefined,
  state: TreeRenderState,
  storageKey: string = TREE_RENDER_STATE_STORAGE_KEY
): void => {
  if (!storage) return;
  try {
    storage.setItem(storageKey, JSON.stringify(state));
  } catch {
    return;
  }
};
