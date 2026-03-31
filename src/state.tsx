import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createTreeRenderState, persistTreeRenderState, readTreeRenderState, TreeRenderState } from './render-persistence';
import { TreeSelection } from './types';

interface TreeStateValue extends TreeRenderState {
    setActiveContextKey: (contextKey: string) => void;
    setExpandedKeys: (contextKey: string, keys: string[]) => void;
    toggleExpandedKey: (contextKey: string, key: string) => void;
    setSelected: (contextKey: string, selection: TreeSelection | null) => void;
}

const TreeStateContext = createContext<TreeStateValue | null>(null);
const readInitialState = (): TreeRenderState => (typeof window === 'undefined' ? createTreeRenderState() : readTreeRenderState(window.localStorage));
const mergeExpandedKeys = (keys: string[], pathIds?: string[]): string[] => {
    const nextKeys = [...keys];
    (pathIds || []).forEach((key) => {
        if (key && !nextKeys.includes(key)) nextKeys.push(key);
    });
    return nextKeys;
};

export const TreeStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<TreeRenderState>(() => readInitialState());

    useEffect(() => {
        if (typeof window !== 'undefined') persistTreeRenderState(window.localStorage, state);
    }, [state]);

    const setActiveContextKey = useCallback((contextKey: string): void => setState((current) => ({ ...current, activeContextKey: contextKey || 'user' })), []);
    const setExpandedKeys = useCallback((contextKey: string, keys: string[]): void => setState((current) => ({ ...current, expandedKeysByContext: { ...current.expandedKeysByContext, [contextKey]: keys } })), []);
    const toggleExpandedKey = useCallback((contextKey: string, key: string): void => {
        setState((current) => {
            const currentKeys = current.expandedKeysByContext[contextKey] || [];
            const nextKeys = currentKeys.includes(key) ? currentKeys.filter((entry) => entry !== key) : [...currentKeys, key];
            return { ...current, expandedKeysByContext: { ...current.expandedKeysByContext, [contextKey]: nextKeys } };
        });
    }, []);
    const setSelected = useCallback((contextKey: string, selection: TreeSelection | null): void => {
        setState((current) => {
            const selectedByContext = { ...current.selectedByContext };
            if (selection) selectedByContext[contextKey] = selection;
            if (!selection) delete selectedByContext[contextKey];
            const expandedKeys = selection?.pathIds?.length ? mergeExpandedKeys(current.expandedKeysByContext[contextKey] || [], selection.pathIds) : current.expandedKeysByContext[contextKey] || [];
            return { ...current, selectedByContext, expandedKeysByContext: { ...current.expandedKeysByContext, [contextKey]: expandedKeys } };
        });
    }, []);

    const value = useMemo<TreeStateValue>(() => ({ ...state, setActiveContextKey, setExpandedKeys, toggleExpandedKey, setSelected }), [setActiveContextKey, setExpandedKeys, setSelected, state, toggleExpandedKey]);
    return <TreeStateContext.Provider value={value}>{children}</TreeStateContext.Provider>;
};

export const useTreeState = (): TreeStateValue => {
    const context = useContext(TreeStateContext);
    if (!context) throw new Error('useTreeState must be used inside TreeStateProvider');
    return context;
};
