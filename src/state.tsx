import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TreeDataSource,
  TreeLoadState,
  TreeNodeRecord,
  TreeSelection,
  ReconcileContextInput,
  TreeChange,
} from "./types";
import { applyTreePatchOperations } from "./reducer";
import {
  createTreeRenderState,
  persistTreeRenderState,
  readTreeRenderState,
  TreeRenderState,
} from "./render-persistence";
import { reconcileTreeWithRetries } from "./reconcile";

interface TreeStateValue<T extends TreeNodeRecord>
  extends TreeRenderState,
    TreeLoadState {
  rootsByContext: Record<string, T[]>;
  loadingNodeIdsByContext: Record<string, Set<string>>;
  setActiveContextKey: (contextKey: string) => void;
  setContextRoots: (contextKey: string, roots: T[]) => void;
  ensureExpandedKey: (contextKey: string, key: string) => void;
  toggleExpandedKey: (contextKey: string, key: string) => void;
  setSelected: (
    contextKey: string,
    selection: TreeSelection | null,
    revealPath?: boolean
  ) => void;
  applyPatch: (
    contextKey: string,
    change: TreeChange<T> | TreeChange<T>[]
  ) => void;
  ensureContextLoaded: (contextKey: string, force?: boolean) => Promise<void>;
  refreshContext: (contextKey: string) => Promise<void>;
  reconcileContext: (input: ReconcileContextInput<T>) => Promise<boolean>;
  lazyLoadNode: (contextKey: string, node: T) => Promise<void>;
  fetchSubTree: (contextKey: string, node: T) => Promise<void>;
}

interface TreeStateProviderProps<T extends TreeNodeRecord> {
  children: React.ReactNode;
  dataSource: TreeDataSource<T>;
  defaultContextKey?: string;
  storageKey?: string;
}

const TreeStateContext = createContext<TreeStateValue<TreeNodeRecord> | null>(
  null
);
const readLoadState = (): TreeLoadState => ({
  loadedContextKeys: {},
  loadingContextKeys: {},
  errorByContext: {},
});
const mergeKeys = (keys: string[], pathIds: string[]): string[] => [
  ...new Set([...keys, ...pathIds]),
];

export const TreeStateProvider = <T extends TreeNodeRecord>({
  children,
  dataSource,
  defaultContextKey,
  storageKey,
}: TreeStateProviderProps<T>) => {
  const [rootsByContext, setRootsByContext] = useState<Record<string, T[]>>({});
  const [loadState, setLoadState] = useState<TreeLoadState>(readLoadState);
  const [loadingNodeIdsByContext, setLoadingNodeIdsByContext] = useState<
    Record<string, Set<string>>
  >({});
  const [state, setState] = useState<TreeRenderState>(() =>
    readTreeRenderState(
      typeof window === "undefined" ? null : window.localStorage,
      defaultContextKey || "default",
      storageKey
    )
  );
  const loadPromises = useRef<Partial<Record<string, Promise<T[]>>>>({});

  useEffect(() => {
    if (typeof window !== "undefined")
      persistTreeRenderState(window.localStorage, state, storageKey);
  }, [state, storageKey]);

  const setActiveContextKey = useCallback(
    (contextKey: string) =>
      setState((current) => ({
        ...current,
        activeContextKey: contextKey || defaultContextKey || "default",
      })),
    [defaultContextKey]
  );
  const setContextRoots = useCallback(
    (contextKey: string, roots: T[]) =>
      setRootsByContext((current) => ({ ...current, [contextKey]: roots })),
    []
  );
  const ensureExpandedKey = useCallback(
    (contextKey: string, key: string) =>
      setState((current) => ({
        ...current,
        expandedKeysByContext: {
          ...current.expandedKeysByContext,
          [contextKey]: mergeKeys(
            current.expandedKeysByContext[contextKey] || [],
            [key]
          ),
        },
      })),
    []
  );
  const toggleExpandedKey = useCallback(
    (contextKey: string, key: string) =>
      setState((current) => ({
        ...current,
        expandedKeysByContext: {
          ...current.expandedKeysByContext,
          [contextKey]: (
            current.expandedKeysByContext[contextKey] || []
          ).includes(key)
            ? (current.expandedKeysByContext[contextKey] || []).filter(
                (entry) => entry !== key
              )
            : [...(current.expandedKeysByContext[contextKey] || []), key],
        },
      })),
    []
  );
  const setSelected = useCallback(
    (
      contextKey: string,
      selection: TreeSelection | null,
      revealPath?: boolean
    ) =>
      setState((current) => {
        const selectedByContext = { ...current.selectedByContext };
        if (selection) selectedByContext[contextKey] = selection;
        if (!selection) delete selectedByContext[contextKey];
        return {
          ...current,
          selectedByContext,
          expandedKeysByContext:
            revealPath && selection
              ? {
                  ...current.expandedKeysByContext,
                  [contextKey]: mergeKeys(
                    current.expandedKeysByContext[contextKey] || [],
                    selection.pathIds
                  ),
                }
              : current.expandedKeysByContext,
        };
      }),
    []
  );
  const applyPatch = useCallback(
    (contextKey: string, change: TreeChange<T> | TreeChange<T>[]) =>
      setRootsByContext((current) => ({
        ...current,
        [contextKey]: applyTreePatchOperations(
          current[contextKey] || [],
          Array.isArray(change) ? change : [change]
        ),
      })),
    []
  );

  const ensureContextLoaded = useCallback(
    async (contextKey: string, force?: boolean): Promise<void> => {
      if (!force && loadState.loadedContextKeys[contextKey]) return;
      setLoadState((current) => ({
        ...current,
        loadingContextKeys: {
          ...current.loadingContextKeys,
          [contextKey]: true,
        },
      }));
      const load =
        !force && loadPromises.current[contextKey]
          ? loadPromises.current[contextKey]
          : dataSource.loadRoots(contextKey);
      if (!force) loadPromises.current[contextKey] = load;
      try {
        const roots = await load;
        setRootsByContext((current) => ({ ...current, [contextKey]: roots }));
        setLoadState((current) => ({
          ...current,
          loadedContextKeys: {
            ...current.loadedContextKeys,
            [contextKey]: true,
          },
          loadingContextKeys: Object.fromEntries(
            Object.entries(current.loadingContextKeys).filter(
              ([key]) => key !== contextKey
            )
          ),
          errorByContext: Object.fromEntries(
            Object.entries(current.errorByContext).filter(
              ([key]) => key !== contextKey
            )
          ),
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load tree.";
        setLoadState((current) => ({
          ...current,
          loadingContextKeys: Object.fromEntries(
            Object.entries(current.loadingContextKeys).filter(
              ([key]) => key !== contextKey
            )
          ),
          errorByContext: { ...current.errorByContext, [contextKey]: message },
        }));
      } finally {
        delete loadPromises.current[contextKey];
      }
    },
    [dataSource, loadState.loadedContextKeys]
  );

  const refreshContext = useCallback(
    async (contextKey: string) => ensureContextLoaded(contextKey, true),
    [ensureContextLoaded]
  );
  const reconcileContext = useCallback(
    async (input: ReconcileContextInput<T>): Promise<boolean> => {
      const result = await reconcileTreeWithRetries({
        fetchRoots: async () => dataSource.loadRoots(input.contextKey),
        matches: input.matches,
        maxAttempts: input.maxAttempts,
        baseDelayMs: input.baseDelayMs,
      });
      if (result.matched) setContextRoots(input.contextKey, result.roots);
      return result.matched;
    },
    [dataSource, setContextRoots]
  );

  const writeNodeLoading = useCallback(
    (contextKey: string, nodeId: string, loading: boolean) =>
      setLoadingNodeIdsByContext((current) => {
        const next = new Set<string>(current[contextKey] || []);
        if (loading) next.add(nodeId);
        if (!loading) next.delete(nodeId);
        return next.size
          ? { ...current, [contextKey]: next }
          : Object.fromEntries(
              Object.entries(current).filter(([key]) => key !== contextKey)
            );
      }),
    []
  );
  const lazyLoadNode = useCallback(
    async (contextKey: string, node: T): Promise<void> => {
      if (!dataSource.loadChildren) return;
      writeNodeLoading(contextKey, node.id, true);
      try {
        const children = await dataSource.loadChildren(node, contextKey);
        applyPatch(contextKey, {
          kind: "set-children",
          nodeId: node.id,
          children,
        });
      } finally {
        writeNodeLoading(contextKey, node.id, false);
      }
    },
    [applyPatch, dataSource, writeNodeLoading]
  );
  const fetchSubTree = useCallback(
    async (contextKey: string, node: T): Promise<void> => {
      if (!dataSource.loadSubTree) return;
      writeNodeLoading(contextKey, node.id, true);
      try {
        const nextNode = await dataSource.loadSubTree(node, contextKey);
        applyPatch(contextKey, {
          kind: "replace-node",
          nodeId: node.id,
          node: nextNode,
        });
      } finally {
        writeNodeLoading(contextKey, node.id, false);
      }
    },
    [applyPatch, dataSource, writeNodeLoading]
  );

  useEffect(() => {
    void ensureContextLoaded(
      state.activeContextKey || defaultContextKey || "default"
    );
  }, [defaultContextKey, ensureContextLoaded, state.activeContextKey]);

  const value = useMemo<TreeStateValue<T>>(
    () => ({
      ...state,
      ...loadState,
      rootsByContext,
      loadingNodeIdsByContext,
      setActiveContextKey,
      setContextRoots,
      ensureExpandedKey,
      toggleExpandedKey,
      setSelected,
      applyPatch,
      ensureContextLoaded,
      refreshContext,
      reconcileContext,
      lazyLoadNode,
      fetchSubTree,
    }),
    [
      applyPatch,
      ensureContextLoaded,
      ensureExpandedKey,
      fetchSubTree,
      lazyLoadNode,
      loadState,
      loadingNodeIdsByContext,
      reconcileContext,
      refreshContext,
      rootsByContext,
      setActiveContextKey,
      setContextRoots,
      setSelected,
      state,
      toggleExpandedKey,
    ]
  );
  return (
    <TreeStateContext.Provider
      value={value as unknown as TreeStateValue<TreeNodeRecord>}
    >
      {children}
    </TreeStateContext.Provider>
  );
};

export const useTreeState = <T extends TreeNodeRecord>(): TreeStateValue<T> => {
  const context = useContext(TreeStateContext);
  if (!context)
    throw new Error("useTreeState must be used inside TreeStateProvider");
  return context as unknown as TreeStateValue<T>;
};
