import { applyTreePatchOperations } from './reducer';
import { TreeController, TreeControllerState, TreePatchOperation, TreeNode } from './types';

const createInitialState = (): TreeControllerState => ({
    rootsByContext: {},
    loadingByContext: {},
    loadingNodeIdsByContext: {},
    expandedKeyByContext: {}
});

const cloneState = (state: TreeControllerState): TreeControllerState => {
    const clonedLoadingNodeIdsByContext: Record<string, Set<string>> = {};

    Object.entries(state.loadingNodeIdsByContext).forEach(([key, value]) => {
        clonedLoadingNodeIdsByContext[key] = new Set<string>(value);
    });

    return {
        rootsByContext: {
            ...state.rootsByContext
        },
        loadingByContext: {
            ...state.loadingByContext
        },
        loadingNodeIdsByContext: clonedLoadingNodeIdsByContext,
        expandedKeyByContext: {
            ...state.expandedKeyByContext
        }
    };
};

export const createTreeController = (seedState?: Partial<TreeControllerState>): TreeController => {
    let state: TreeControllerState = {
        ...createInitialState(),
        ...(seedState || {})
    };

    const listeners = new Set<(nextState: TreeControllerState) => void>();

    const notify = (): void => {
        const snapshot = cloneState(state);
        listeners.forEach((listener) => listener(snapshot));
    };

    return {
        getState: (): TreeControllerState => cloneState(state),
        subscribe: (listener): (() => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        setRoots: (contextKey: string, roots: TreeNode[]): void => {
            state = {
                ...state,
                rootsByContext: {
                    ...state.rootsByContext,
                    [contextKey]: roots
                }
            };

            notify();
        },
        applyPatch: (contextKey: string, operation: TreePatchOperation | TreePatchOperation[]): void => {
            const operations = Array.isArray(operation) ? operation : [operation];
            if (!operations.length) {
                return;
            }

            const currentRoots = state.rootsByContext[contextKey] || [];
            const nextRoots = applyTreePatchOperations(currentRoots, operations);
            state = {
                ...state,
                rootsByContext: {
                    ...state.rootsByContext,
                    [contextKey]: nextRoots
                }
            };

            notify();
        },
        setContextLoading: (contextKey: string, loading: boolean): void => {
            const nextLoadingByContext = {
                ...state.loadingByContext
            };

            if (loading) {
                nextLoadingByContext[contextKey] = true;
            } else {
                delete nextLoadingByContext[contextKey];
            }

            state = {
                ...state,
                loadingByContext: nextLoadingByContext
            };

            notify();
        },
        setNodeLoading: (contextKey: string, nodeIds: Array<string | null | undefined>, loading: boolean): void => {
            const normalizedIds = nodeIds.map((entry) => (entry || '').trim()).filter((entry): entry is string => Boolean(entry));
            if (!normalizedIds.length) {
                return;
            }

            const currentSet = new Set<string>(state.loadingNodeIdsByContext[contextKey] || []);
            normalizedIds.forEach((id) => {
                if (loading) {
                    currentSet.add(id);
                } else {
                    currentSet.delete(id);
                }
            });

            const nextLoadingNodeIdsByContext = {
                ...state.loadingNodeIdsByContext
            };

            if (currentSet.size > 0) {
                nextLoadingNodeIdsByContext[contextKey] = currentSet;
            } else {
                delete nextLoadingNodeIdsByContext[contextKey];
            }

            state = {
                ...state,
                loadingNodeIdsByContext: nextLoadingNodeIdsByContext
            };

            notify();
        },
        setExpandedKey: (contextKey: string, key: string): void => {
            state = {
                ...state,
                expandedKeyByContext: {
                    ...state.expandedKeyByContext,
                    [contextKey]: key
                }
            };

            notify();
        }
    };
};
