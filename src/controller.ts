import {
  applyTreePatchOperations,
  findNodeById,
  findTreeChild,
  findTreeParent,
} from "./reducer";
import {
  TreeChange,
  TreeController,
  TreeControllerState,
  TreeMatch,
  TreeNodeRecord,
  TreeSelection,
} from "./types";

const createState = <T extends TreeNodeRecord>(): TreeControllerState<T> => ({
  rootsByContext: {},
  expandedKeysByContext: {},
  selectedByContext: {},
  filterByContext: {},
  loadingContextKeys: {},
  loadingNodeIdsByContext: {},
});

const copyState = <T extends TreeNodeRecord>(
  state: TreeControllerState<T>
): TreeControllerState<T> => {
  const loadingNodeIdsByContext: Record<string, Set<string>> = {};
  Object.entries(state.loadingNodeIdsByContext).forEach(([key, value]) => {
    loadingNodeIdsByContext[key] = new Set<string>(value);
  });
  return {
    ...state,
    rootsByContext: { ...state.rootsByContext },
    expandedKeysByContext: { ...state.expandedKeysByContext },
    selectedByContext: { ...state.selectedByContext },
    filterByContext: { ...state.filterByContext },
    loadingContextKeys: { ...state.loadingContextKeys },
    loadingNodeIdsByContext,
  };
};

const writeExpanded = (
  state: TreeControllerState<TreeNodeRecord>,
  contextKey: string,
  nodeId: string,
  open: boolean
): TreeControllerState<TreeNodeRecord> => {
  const current = state.expandedKeysByContext[contextKey] || [];
  const next = open
    ? [...new Set([...current, nodeId])]
    : current.filter((entry) => entry !== nodeId);
  return {
    ...state,
    expandedKeysByContext: {
      ...state.expandedKeysByContext,
      [contextKey]: next,
    },
  };
};

export const createTreeController = <T extends TreeNodeRecord>(
  seedState?: Partial<TreeControllerState<T>>
): TreeController<T> => {
  let state = {
    ...createState<T>(),
    ...(seedState || {}),
  } as TreeControllerState<T>;
  const listeners = new Set<(state: TreeControllerState<T>) => void>();
  const notify = (): void =>
    listeners.forEach((listener) => listener(copyState(state)));
  const readRoots = (contextKey: string): T[] =>
    state.rootsByContext[contextKey] || [];
  const writeSelection = (
    contextKey: string,
    selection: TreeSelection | null
  ): void => {
    const selectedByContext = { ...state.selectedByContext };
    if (selection) selectedByContext[contextKey] = selection;
    if (!selection) delete selectedByContext[contextKey];
    state = { ...state, selectedByContext };
  };

  return {
    getState: () => copyState(state),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setRoots: (contextKey, roots) => {
      state = {
        ...state,
        rootsByContext: { ...state.rootsByContext, [contextKey]: roots },
      };
      notify();
    },
    applyChanges: (contextKey, changes) => {
      const list = Array.isArray(changes) ? changes : [changes];
      state = {
        ...state,
        rootsByContext: {
          ...state.rootsByContext,
          [contextKey]: applyTreePatchOperations(
            readRoots(contextKey),
            list as TreeChange<T>[]
          ),
        },
      };
      notify();
    },
    setContextLoading: (contextKey, loading) => {
      state = {
        ...state,
        loadingContextKeys: loading
          ? { ...state.loadingContextKeys, [contextKey]: true }
          : Object.fromEntries(
              Object.entries(state.loadingContextKeys).filter(
                ([key]) => key !== contextKey
              )
            ),
      };
      notify();
    },
    setNodeLoading: (contextKey, nodeIds, loading) => {
      const next = new Set<string>(
        state.loadingNodeIdsByContext[contextKey] || []
      );
      nodeIds
        .filter(Boolean)
        .forEach((nodeId) =>
          loading ? next.add(nodeId) : next.delete(nodeId)
        );
      state = {
        ...state,
        loadingNodeIdsByContext: next.size
          ? { ...state.loadingNodeIdsByContext, [contextKey]: next }
          : Object.fromEntries(
              Object.entries(state.loadingNodeIdsByContext).filter(
                ([key]) => key !== contextKey
              )
            ),
      };
      notify();
    },
    setSelected: (contextKey, selection) => {
      writeSelection(contextKey, selection);
      notify();
    },
    expand: (contextKey, nodeId) => {
      state = writeExpanded(
        state as TreeControllerState<TreeNodeRecord>,
        contextKey,
        nodeId,
        true
      ) as TreeControllerState<T>;
      notify();
    },
    collapse: (contextKey, nodeId) => {
      state = writeExpanded(
        state as TreeControllerState<TreeNodeRecord>,
        contextKey,
        nodeId,
        false
      ) as TreeControllerState<T>;
      notify();
    },
    setFilter: (contextKey, value) => {
      state = {
        ...state,
        filterByContext: { ...state.filterByContext, [contextKey]: value },
      };
      notify();
    },
    getParent: (contextKey, nodeId) => {
      const node = findNodeById(readRoots(contextKey), nodeId);
      return node && node.parentId
        ? findNodeById(readRoots(contextKey), node.parentId)
        : null;
    },
    getChildren: (contextKey, nodeId) =>
      nodeId
        ? (findNodeById(readRoots(contextKey), nodeId)?.children as T[]) || []
        : readRoots(contextKey),
    findParent: (contextKey, nodeId, match) =>
      findTreeParent(readRoots(contextKey), nodeId, match as TreeMatch<T>),
    findChild: (contextKey, nodeId, match) =>
      findTreeChild(readRoots(contextKey), nodeId, match as TreeMatch<T>),
  };
};
