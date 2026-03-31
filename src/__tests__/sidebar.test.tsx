// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TreeSidebar, TreeStateProvider } from '../index';

const items = [{
    id: 'group-u',
    label: 'User Tree',
    nodeType: 'group' as const,
    treeContextKey: 'user',
    items: [{ id: 'channel-1', label: 'Channel 1', nodeType: 'channel' as const, treeContextKey: 'user', scope: 'u' as const, pathIds: ['group-u', 'channel-1'] }]
}];

describe('TreeSidebar', () => {
    it('selects on label click and expands only from the toggle button', () => {
        const onSelect = vi.fn();
        render(<TreeStateProvider><TreeSidebar activeContextKey="user" items={items} onSelect={onSelect} /></TreeStateProvider>);

        fireEvent.click(screen.getByText('User Tree'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Channel 1')).toBeNull();

        fireEvent.click(screen.getByLabelText('Expand User Tree'));
        expect(screen.getByText('Channel 1')).toBeTruthy();
    });

    it('keeps branch expansion when a nested item is selected', () => {
        render(<TreeStateProvider><TreeSidebar activeContextKey="user" items={items} /></TreeStateProvider>);

        fireEvent.click(screen.getByLabelText('Expand User Tree'));
        fireEvent.click(screen.getByText('Channel 1'));
        expect(screen.getByText('Channel 1')).toBeTruthy();
    });
});
