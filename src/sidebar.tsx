import React from 'react';
import { readTreeSelectionForModel } from './selection';
import { TreeSidebarItem } from './sidebar-item';
import { useTreeState } from './state';
import { TreeNodeModel } from './types';

interface TreeSidebarProps {
    activeContextKey: string;
    items: TreeNodeModel[];
    onSelect?: (item: TreeNodeModel) => void;
    onExpand?: (item: TreeNodeModel) => void;
    onContextMenu?: (event: React.MouseEvent<HTMLElement>, item: TreeNodeModel) => void;
    onOpenUrl?: (item: TreeNodeModel) => void;
}

const TreeSidebarInner = ({ activeContextKey, items, onSelect, onExpand, onContextMenu, onOpenUrl }: TreeSidebarProps) => {
    const { expandedKeysByContext, selectedByContext, setActiveContextKey, setSelected, toggleExpandedKey } = useTreeState();

    return (
        <ul className="list-none p-0 m-0">
            {items.map((item) => (
                <TreeSidebarItem
                    key={`${item.treeContextKey || activeContextKey}-${item.id}`}
                    item={item}
                    expandedKeysByContext={expandedKeysByContext}
                    selectedByContext={selectedByContext}
                    onSelect={(nextItem) => {
                        const contextKey = nextItem.treeContextKey || activeContextKey;
                        setActiveContextKey(contextKey);
                        setSelected(contextKey, readTreeSelectionForModel(contextKey, nextItem));
                        onSelect?.(nextItem);
                    }}
                    onToggle={(nextItem) => toggleExpandedKey(nextItem.treeContextKey || activeContextKey, nextItem.id)}
                    onExpand={onExpand}
                    onContextMenu={onContextMenu}
                    onOpenUrl={onOpenUrl}
                />
            ))}
        </ul>
    );
};

export const TreeSidebar = (props: TreeSidebarProps) => <TreeSidebarInner {...props} />;
