import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { readRootDefinitions } from './node';
import { TreeSidebarItem } from './sidebar-item';
import { useTreeState } from './state';
import { buildTreeItems } from './tree-data';
import { TreeNode, TreeNodeModel, TreePostRecord } from './types';

interface TreeProps {
    children: React.ReactNode;
    className?: string;
    onContextMenu?: (event: React.MouseEvent<HTMLElement>, item: TreeNodeModel) => void;
    onOpenUrl?: (item: TreeNodeModel) => void;
    onSelect?: (item: TreeNodeModel) => void;
    readNodeActionUrl?: (node: TreeNode, contextKey: string, organizationId?: string | null) => string | undefined;
    readPostActionUrl?: (node: TreeNode, post: TreePostRecord, contextKey: string, organizationId?: string | null) => string | undefined;
}

export const Tree = ({ children, className, onContextMenu, onOpenUrl, onSelect, readNodeActionUrl, readPostActionUrl }: TreeProps) => {
    const { activeContextKey, ensureContextLoaded, expandedKeysByContext, isOrganizationsLoading, loadingContextKeys, organizations, rootsByContext, selectedByContext, setActiveContextKey, setSelected, toggleExpandedKey } = useTreeState();
    const treeRef = useRef<HTMLDivElement | null>(null);
    const selectedScrollRef = useRef('');
    const definitions = useMemo(() => readRootDefinitions(children), [children]);
    const items = useMemo(() => buildTreeItems({ definitions, rootsByContext, organizations, loadingContextKeys, isOrganizationsLoading, readNodeActionUrl, readPostActionUrl }), [definitions, isOrganizationsLoading, loadingContextKeys, organizations, readNodeActionUrl, readPostActionUrl, rootsByContext]);
    const selectedItemId = selectedByContext[activeContextKey]?.id || '';

    useEffect(() => {
        void ensureContextLoaded(activeContextKey);
    }, [activeContextKey, ensureContextLoaded]);
    useEffect(() => {
        const selectedKey = selectedItemId ? `${activeContextKey}:${selectedItemId}` : '';
        if (!treeRef.current || !selectedKey || selectedScrollRef.current === selectedKey) return;
        selectedScrollRef.current = selectedKey;
        const selectedNode = treeRef.current.querySelector('[data-tree-selected="true"]');
        if (selectedNode && 'scrollIntoView' in selectedNode && typeof selectedNode.scrollIntoView === 'function') {
            selectedNode.scrollIntoView({ block: 'nearest' });
        }
    }, [activeContextKey, selectedItemId]);

    const handleSelect = useCallback((item: TreeNodeModel): void => {
        const contextKey = item.treeContextKey || activeContextKey;
        setActiveContextKey(contextKey);
        setSelected(contextKey, { id: item.id, nodeType: item.nodeType, treeContextKey: contextKey, scope: item.scope, organizationId: item.organizationId || null, subjectId: item.subjectId, pathIds: item.pathIds || [] });
        if (item.organizationId && item.nodeType === 'group') void ensureContextLoaded(contextKey);
        onSelect?.(item);
    }, [activeContextKey, ensureContextLoaded, onSelect, setActiveContextKey, setSelected]);

    const handleExpand = useCallback((item: TreeNodeModel): void => {
        if (item.organizationId && item.nodeType === 'group') void ensureContextLoaded(item.treeContextKey || activeContextKey);
    }, [activeContextKey, ensureContextLoaded]);

    return (
        <div ref={treeRef} className={className || 'h-full w-full min-h-0 overflow-y-auto overflow-x-hidden'} data-cy="tree-root">
            <ul className="list-none p-0 m-0">
                {items.map((item) => (
                    <TreeSidebarItem
                        key={`${item.treeContextKey || ''}-${item.id}`}
                        depth={0}
                        item={item}
                        expandedKeysByContext={expandedKeysByContext}
                        selectedByContext={selectedByContext}
                        onSelect={handleSelect}
                        onToggle={(nextItem) => toggleExpandedKey(nextItem.treeContextKey || activeContextKey, nextItem.id)}
                        onExpand={handleExpand}
                        onContextMenu={onContextMenu}
                        onOpenUrl={onOpenUrl}
                    />
                ))}
            </ul>
        </div>
    );
};
