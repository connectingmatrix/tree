import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TreeApiAdapter } from './api';
import { organizationTreeContextKey, resolveOrganizationIdFromContextKey } from './context';
import { normalizeTreeNodes } from './normalize';
import { applyTreePatchOperations } from './reducer';
import { createTreeRenderState, persistTreeRenderState, readTreeRenderState, TreeRenderState } from './render-persistence';
import { reconcileTreeWithRetries } from './reconcile';
import { ReconcileContextInput, TreeLoadState, TreeNode, TreeOrganizationRecord, TreePatchOperation, TreeSelection } from './types';

interface TreeStateValue extends TreeRenderState, TreeLoadState {
    rootsByContext: Record<string, TreeNode[]>;
    setActiveContextKey: (contextKey: string) => void;
    setContextRoots: (contextKey: string, roots: TreeNode[]) => void;
    toggleExpandedKey: (contextKey: string, key: string) => void;
    setSelected: (contextKey: string, selection: TreeSelection | null, revealPath?: boolean) => void;
    applyPatch: (contextKey: string, operation: TreePatchOperation | TreePatchOperation[]) => void;
    ensureContextLoaded: (contextKey: string, force?: boolean) => Promise<void>;
    refreshContext: (contextKey: string) => Promise<void>;
    reconcileContext: (input: ReconcileContextInput) => Promise<boolean>;
}

interface TreeStateProviderProps {
    adapter: TreeApiAdapter;
    children: React.ReactNode;
    ownerUserPermissionsId?: string;
}

const TreeStateContext = createContext<TreeStateValue | null>(null);
const readInitialState = (): TreeRenderState => (typeof window === 'undefined' ? createTreeRenderState() : readTreeRenderState(window.localStorage));
const mergeExpandedKeys = (keys: string[], pathIds?: string[]): string[] => [...new Set([...(keys || []), ...(pathIds || [])].filter(Boolean))];
const readLoadState = (): TreeLoadState => ({ loadedContextKeys: {}, loadingContextKeys: {}, errorByContext: {}, organizations: [], isOrganizationsLoading: false, organizationError: null });
const omitKey = <T extends Record<string, unknown>>(record: T, key: string): T => {
    const next = { ...record };
    delete next[key];
    return next;
};

const readContextRoots = async (adapter: TreeApiAdapter, ownerUserPermissionsId: string, contextKey: string): Promise<Record<string, TreeNode[]>> => {
    const organizationId = resolveOrganizationIdFromContextKey(contextKey);
    if (organizationId) {
        const result = await adapter.fetchTree({ scope: 'u', userPermissionsId: ownerUserPermissionsId, includeGlobal: false, organizationId });
        return { [organizationTreeContextKey(organizationId)]: normalizeTreeNodes({ scope: 'u', rawNodes: result.user || [] }) };
    }
    const result = await adapter.fetchTree({ scope: 'u', userPermissionsId: ownerUserPermissionsId, includeGlobal: true, organizationId: null });
    return { user: normalizeTreeNodes({ scope: 'u', rawNodes: result.user || [] }), global: normalizeTreeNodes({ scope: 'g', rawNodes: result.global || [] }) };
};

export const TreeStateProvider = ({ adapter, children, ownerUserPermissionsId }: TreeStateProviderProps) => {
    const [state, setState] = useState<TreeRenderState>(() => readInitialState());
    const [rootsByContext, setRootsByContext] = useState<Record<string, TreeNode[]>>({});
    const [loadState, setLoadState] = useState<TreeLoadState>(() => readLoadState());
    const loadStateRef = useRef<TreeLoadState>(loadState);

    useEffect(() => {
        if (typeof window !== 'undefined') persistTreeRenderState(window.localStorage, state);
    }, [state]);
    useEffect(() => {
        loadStateRef.current = loadState;
    }, [loadState]);

    const setActiveContextKey = useCallback((contextKey: string): void => setState((current) => ({ ...current, activeContextKey: contextKey || 'user' })), []);
    const setContextRoots = useCallback((contextKey: string, roots: TreeNode[]): void => setRootsByContext((current) => ({ ...current, [contextKey]: roots })), []);
    const toggleExpandedKey = useCallback((contextKey: string, key: string): void => setState((current) => {
        const keys = current.expandedKeysByContext[contextKey] || [];
        const nextKeys = keys.includes(key) ? keys.filter((entry) => entry !== key) : [...keys, key];
        return { ...current, expandedKeysByContext: { ...current.expandedKeysByContext, [contextKey]: nextKeys } };
    }), []);
    const setSelected = useCallback((contextKey: string, selection: TreeSelection | null, revealPath?: boolean): void => setState((current) => {
        const selectedByContext = { ...current.selectedByContext };
        if (selection) selectedByContext[contextKey] = selection;
        if (!selection) delete selectedByContext[contextKey];
        return {
            ...current,
            selectedByContext,
            expandedKeysByContext: {
                ...current.expandedKeysByContext,
                [contextKey]: revealPath ? mergeExpandedKeys(current.expandedKeysByContext[contextKey] || [], selection?.pathIds) : current.expandedKeysByContext[contextKey] || []
            }
        };
    }), []);
    const applyPatch = useCallback((contextKey: string, operation: TreePatchOperation | TreePatchOperation[]): void => {
        const operations = Array.isArray(operation) ? operation : [operation];
        setRootsByContext((current) => ({ ...current, [contextKey]: applyTreePatchOperations(current[contextKey] || [], operations) }));
    }, []);

    const ensureContextLoaded = useCallback(async (contextKey: string, force?: boolean): Promise<void> => {
        if (!ownerUserPermissionsId || (!force && loadStateRef.current.loadedContextKeys[contextKey]) || loadStateRef.current.loadingContextKeys[contextKey]) return;
        setLoadState((current) => ({ ...current, loadingContextKeys: { ...current.loadingContextKeys, [contextKey]: true } }));
        try {
            const nextRoots = await readContextRoots(adapter, ownerUserPermissionsId, contextKey);
            setRootsByContext((current) => ({ ...current, ...nextRoots }));
            setLoadState((current) => ({ ...current, loadedContextKeys: { ...current.loadedContextKeys, ...Object.keys(nextRoots).reduce((result, key) => ({ ...result, [key]: true }), {}) }, errorByContext: omitKey(current.errorByContext, contextKey), loadingContextKeys: omitKey(current.loadingContextKeys, contextKey) }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not load tree.';
            setLoadState((current) => ({ ...current, errorByContext: { ...current.errorByContext, [contextKey]: message }, loadingContextKeys: omitKey(current.loadingContextKeys, contextKey) }));
        }
    }, [adapter, ownerUserPermissionsId]);

    const refreshContext = useCallback(async (contextKey: string): Promise<void> => ensureContextLoaded(contextKey, true), [ensureContextLoaded]);
    const reconcileContext = useCallback(async (input: ReconcileContextInput): Promise<boolean> => {
        if (!ownerUserPermissionsId) return false;
        const result = await reconcileTreeWithRetries({ maxAttempts: input.maxAttempts, baseDelayMs: input.baseDelayMs, matches: input.matches, fetchRoots: async () => (await readContextRoots(adapter, ownerUserPermissionsId, input.contextKey))[input.contextKey] || [] });
        if (result.matched) setContextRoots(input.contextKey, result.roots);
        return result.matched;
    }, [adapter, ownerUserPermissionsId, setContextRoots]);

    useEffect(() => {
        if (!ownerUserPermissionsId) {
            setRootsByContext({});
            setLoadState(readLoadState());
            return;
        }
        void ensureContextLoaded('user', true);
        setLoadState((current) => ({ ...current, isOrganizationsLoading: true, organizationError: null }));
        adapter.listOrganizations().then((organizations) => {
            const nextOrganizations: TreeOrganizationRecord[] = organizations.map((entry) => ({ id: entry.id, name: entry.name }));
            setLoadState((current) => ({ ...current, organizations: nextOrganizations, isOrganizationsLoading: false, organizationError: null }));
        }).catch((error) => {
            const message = error instanceof Error ? error.message : 'Could not load organisations.';
            setLoadState((current) => ({ ...current, isOrganizationsLoading: false, organizationError: message }));
        });
    }, [adapter, ensureContextLoaded, ownerUserPermissionsId]);

    useEffect(() => {
        const organizationId = resolveOrganizationIdFromContextKey(state.activeContextKey);
        if (organizationId) void ensureContextLoaded(organizationTreeContextKey(organizationId));
    }, [ensureContextLoaded, state.activeContextKey]);

    const value = useMemo<TreeStateValue>(() => ({ ...state, ...loadState, rootsByContext, setActiveContextKey, setContextRoots, toggleExpandedKey, setSelected, applyPatch, ensureContextLoaded, refreshContext, reconcileContext }), [applyPatch, ensureContextLoaded, loadState, reconcileContext, refreshContext, rootsByContext, setActiveContextKey, setContextRoots, setSelected, state, toggleExpandedKey]);
    return <TreeStateContext.Provider value={value}>{children}</TreeStateContext.Provider>;
};

export const useTreeState = (): TreeStateValue => {
    const context = useContext(TreeStateContext);
    if (!context) throw new Error('useTreeState must be used inside TreeStateProvider');
    return context;
};
