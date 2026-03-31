// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Node, Tree, TreeStateProvider } from '../index';

const adapter = {
    fetchTree: vi.fn(async (input: { organizationId?: string | null }) => ({
        user: input.organizationId
            ? [{ id: 'org-channel', nodeType: 'CHANNEL' as const, name: 'Org Channel', children: [] }]
            : [{ id: 'channel-1', nodeType: 'CHANNEL' as const, name: 'Channel 1', children: [{ id: 'channel-2', nodeType: 'CHANNEL' as const, name: 'Child Channel', children: [] }] }],
        global: []
    })),
    listOrganizations: vi.fn(async () => [{ id: 'org-1', name: 'Org One' }]),
    createChannel: vi.fn(),
    createCategory: vi.fn(),
    createSubject: vi.fn(),
    deleteChannel: vi.fn(),
    deleteCategory: vi.fn(),
    deleteSubject: vi.fn(),
    deletePost: vi.fn(),
    moveChannel: vi.fn(),
    linkCategoryToChannels: vi.fn(),
    linkSubjectToCategory: vi.fn()
};

class ResizeObserverMock {
    observe() {}
    disconnect() {}
}

const renderTree = (onSelect?: (item: unknown) => void) =>
    render(
        React.createElement(
            'div',
            { style: { width: 400, height: 500 } },
            React.createElement(
                TreeStateProvider,
                {
                    adapter,
                    ownerUserPermissionsId: 'user-1',
                    children: React.createElement(
                        Tree,
                        {
                            onSelect,
                            children: [React.createElement(Node, { kind: 'user-root', key: 'user-root' }), React.createElement(Node, { kind: 'organization-root', key: 'organization-root' }), React.createElement(Node, { kind: 'global-root', key: 'global-root' })]
                        }
                    )
                }
            )
        )
    );

describe('Tree', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });
    afterEach(() => cleanup());

    it('selects a user node without using a route-driven renderer', async () => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        const onSelect = vi.fn();
        renderTree(onSelect);
        await waitFor(() => expect(screen.getByText('Channel 1')).toBeTruthy());
        fireEvent.click(screen.getByText('Channel 1'));
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('loads organization groups from the shared provider state', async () => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        renderTree();
        await waitFor(() => expect(screen.getAllByText('Organisations').length).toBeGreaterThan(0));
        expect(adapter.listOrganizations).toHaveBeenCalled();
    });

    it('hides user children when the user root is collapsed', async () => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        renderTree();
        await waitFor(() => expect(screen.getAllByText('Channel 1').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByLabelText('Collapse User Tree')[0]);
        await waitFor(() => expect(screen.queryAllByText('Channel 1')).toHaveLength(0));
    });

    it('hides nested children when a branch is collapsed', async () => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        renderTree();
        await waitFor(() => expect(screen.getAllByText('Channel 1').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByLabelText('Expand Channel 1')[0]);
        await waitFor(() => expect(screen.getAllByText('Child Channel').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByLabelText('Collapse Channel 1')[0]);
        await waitFor(() => expect(screen.queryAllByText('Child Channel')).toHaveLength(0));
    });

    it('keeps a collapsed branch closed after selecting a descendant', async () => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        renderTree();
        await waitFor(() => expect(screen.getAllByText('Channel 1').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByLabelText('Expand Channel 1')[0]);
        await waitFor(() => expect(screen.getAllByText('Child Channel').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByText('Child Channel')[0]);
        fireEvent.click(screen.getAllByLabelText('Collapse Channel 1')[0]);
        await waitFor(() => expect(screen.queryAllByText('Child Channel')).toHaveLength(0));
    });
});
