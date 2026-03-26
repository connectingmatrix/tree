import { USER_TREE_MENU_KEY } from './context';
import { StorageLike } from './types';

export const TREE_MENU_STATE_STORAGE_KEY = 'giga_tree_menu_state_v1';

export const readPersistedExpandedState = (storage: StorageLike | null | undefined, storageKey: string = TREE_MENU_STATE_STORAGE_KEY): Record<string, string> => {
    if (!storage) {
        return {
            user: USER_TREE_MENU_KEY
        };
    }

    try {
        const rawValue = storage.getItem(storageKey);
        if (!rawValue) {
            return {
                user: USER_TREE_MENU_KEY
            };
        }

        const parsed = JSON.parse(rawValue) as Record<string, unknown>;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {
                user: USER_TREE_MENU_KEY
            };
        }

        const nextState: Record<string, string> = {};
        Object.entries(parsed).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim()) {
                nextState[key] = value.trim();
            }
        });

        if (!nextState.user) {
            nextState.user = USER_TREE_MENU_KEY;
        }

        return nextState;
    } catch {
        return {
            user: USER_TREE_MENU_KEY
        };
    }
};

export const persistExpandedState = (storage: StorageLike | null | undefined, state: Record<string, string>, storageKey: string = TREE_MENU_STATE_STORAGE_KEY): void => {
    if (!storage) {
        return;
    }

    try {
        storage.setItem(storageKey, JSON.stringify(state));
    } catch {
        // ignore storage errors and keep state in memory
    }
};

export const resolveExpandedKeyForContext = (state: Record<string, string>, contextKey: string): string => {
    return state[contextKey] || state.user || USER_TREE_MENU_KEY;
};

export const setExpandedKeyForContext = (state: Record<string, string>, contextKey: string, value: string): Record<string, string> => {
    const normalizedValue = value.trim();
    const resolvedUserValue = contextKey === 'user' ? normalizedValue || USER_TREE_MENU_KEY : state.user || USER_TREE_MENU_KEY;
    const resolvedValue = normalizedValue || (contextKey === 'user' ? USER_TREE_MENU_KEY : resolvedUserValue);

    return {
        ...state,
        [contextKey]: resolvedValue,
        user: resolvedUserValue
    };
};
