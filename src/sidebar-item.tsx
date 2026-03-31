import React from 'react';
import { TreeNodeModel, TreeSelection } from './types';

interface TreeSidebarItemProps {
    item: TreeNodeModel;
    expandedKeysByContext: Record<string, string[]>;
    selectedByContext: Record<string, TreeSelection>;
    onSelect: (item: TreeNodeModel) => void;
    onToggle: (item: TreeNodeModel) => void;
    onExpand?: (item: TreeNodeModel) => void;
    onContextMenu?: (event: React.MouseEvent<HTMLElement>, item: TreeNodeModel) => void;
    onOpenUrl?: (item: TreeNodeModel) => void;
}

export const TreeSidebarItem = ({ item, expandedKeysByContext, selectedByContext, onSelect, onToggle, onExpand, onContextMenu, onOpenUrl }: TreeSidebarItemProps) => {
    const hasChildren = Boolean(item.items?.length || item.canLazyLoadChildren);
    const contextKey = item.treeContextKey || 'user';
    const expanded = (expandedKeysByContext[contextKey] || []).includes(item.id);
    const selected = selectedByContext[contextKey] || null;
    const selectedItem = selected?.id === item.id && selected.nodeType === item.nodeType;

    return (
        <li className="list-none">
            <div className={`flex align-items-center gap-2 border-round p-2 ${selectedItem ? 'bg-primary-50 text-primary-700' : 'text-700 hover:surface-hover'}`}>
                <button type="button" className="p-link border-none bg-transparent flex align-items-center gap-2 flex-1 text-left" onClick={() => onSelect(item)} onContextMenu={(event) => onContextMenu?.(event, item)}>
                    <i className={item.loading ? 'pi pi-spinner pi-spin' : item.icon} />
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                </button>
                {hasChildren ? (
                    <button
                        type="button"
                        className="p-link border-none bg-transparent"
                        aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        onClick={() => {
                            if (!expanded) {
                                onExpand?.(item);
                            }
                            onToggle(item);
                        }}
                    >
                        <i className={`pi ${expanded ? 'pi-angle-down' : 'pi-angle-right'}`} />
                    </button>
                ) : null}
                {item.url ? (
                    <button type="button" className="p-link border-none bg-transparent" aria-label={`Open ${item.label}`} onClick={() => onOpenUrl?.(item)}>
                        <i className="pi pi-arrow-up-right" />
                    </button>
                ) : null}
            </div>
            {hasChildren && expanded ? (
                <ul className="list-none pl-4 m-0">
                    {(item.items || []).map((child) => (
                        <TreeSidebarItem
                            key={`${child.treeContextKey || ''}-${child.id}`}
                            item={child}
                            expandedKeysByContext={expandedKeysByContext}
                            selectedByContext={selectedByContext}
                            onSelect={onSelect}
                            onToggle={onToggle}
                            onExpand={onExpand}
                            onContextMenu={onContextMenu}
                            onOpenUrl={onOpenUrl}
                        />
                    ))}
                </ul>
            ) : null}
        </li>
    );
};
