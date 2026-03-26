import { describe, expect, it } from 'vitest';
import { readPersistedExpandedState, resolveExpandedKeyForContext, setExpandedKeyForContext } from '../persistence';
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

describe('persistence helpers', () => {
    it('falls back to user tree when storage payload is missing or malformed', () => {
        const malformed = createMemoryStorage('{broken-json');
        const state = readPersistedExpandedState(malformed);

        expect(state.user).toBe('group-u');
    });

    it('resolves and sets expanded context keys deterministically', () => {
        const storage = createMemoryStorage(JSON.stringify({ user: 'group-u::channel-1', global: 'group-g::channel-2' }));
        const state = readPersistedExpandedState(storage);

        expect(resolveExpandedKeyForContext(state, 'global')).toBe('group-g::channel-2');

        const nextState = setExpandedKeyForContext(state, 'organization:org-1', 'group-org::ch-1');
        expect(nextState['organization:org-1']).toBe('group-org::ch-1');
        expect(nextState.user).toBe('group-u::channel-1');
    });

    it('updates user context expansion without being overwritten by previous user state', () => {
        const state = readPersistedExpandedState(createMemoryStorage(JSON.stringify({ user: 'group-u' })));
        const nextState = setExpandedKeyForContext(state, 'user', 'group-u::channel-99');

        expect(nextState.user).toBe('group-u::channel-99');
        expect(resolveExpandedKeyForContext(nextState, 'user')).toBe('group-u::channel-99');
    });

    it('keeps user fallback and existing user state stable for non-user context updates', () => {
        const fallbackState = setExpandedKeyForContext({}, 'global', 'group-g::channel-2');
        expect(fallbackState.user).toBe('group-u');
        expect(fallbackState.global).toBe('group-g::channel-2');

        const seededState = readPersistedExpandedState(createMemoryStorage(JSON.stringify({ user: 'group-u::channel-5' })));
        const nextState = setExpandedKeyForContext(seededState, 'organization:org-2', 'group-org::branch-1');
        expect(nextState.user).toBe('group-u::channel-5');
        expect(nextState['organization:org-2']).toBe('group-org::branch-1');
    });
});
