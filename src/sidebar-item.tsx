import React from 'react';
import { TreeNodeModel, TreeSelection } from './types';

interface TreeSidebarItemProps {
    depth: number;
    item: TreeNodeModel;
    expandedKeysByContext: Record<string, string[]>;
    selectedByContext: Record<string, TreeSelection>;
    onSelect: (item: TreeNodeModel) => void;
    onToggle: (item: TreeNodeModel) => void;
    onExpand?: (item: TreeNodeModel) => void;
    onContextMenu?: (event: React.MouseEvent<HTMLElement>, item: TreeNodeModel) => void;
    onOpenUrl?: (item: TreeNodeModel) => void;
}

const readDataCyKey = (contextKey: string, item: TreeNodeModel): string => `${contextKey}-${item.nodeType}-${item.id}`.replace(/[^a-zA-Z0-9_-]/g, '-');

export const TreeSidebarItem = ({ depth, item, expandedKeysByContext, selectedByContext, onSelect, onToggle, onExpand, onContextMenu, onOpenUrl }: TreeSidebarItemProps) => {
    const hasChildren = Boolean(item.items?.length || item.canLazyLoadChildren);
    const contextKey = item.treeContextKey || 'user';
    const dataCyKey = readDataCyKey(contextKey, item);
    const expanded = (expandedKeysByContext[contextKey] || []).includes(item.id);
    const selected = selectedByContext[contextKey] || null;
    const selectedItem = selected?.id === item.id && selected.nodeType === item.nodeType;
    const level = `${depth + 1}`;

    return (
        <li className="list-none">
            <div
                className={`flex align-items-start gap-1 transition-colors transition-duration-150 ${selectedItem ? 'text-900' : 'text-700 hover:surface-hover'}`}
                style={{ marginLeft: `${depth * 21}px`, minHeight: '29px', padding: '7px 4px', borderRadius: '10px', background: selectedItem ? '#edf4ff' : 'transparent' }}
                data-cy={`tree-row-${dataCyKey}`}
                data-tree-context={contextKey}
                data-tree-expanded={hasChildren && expanded ? 'true' : 'false'}
                data-tree-level={level}
                data-tree-node-id={item.id}
                data-tree-node-type={item.nodeType}
                data-tree-selected={selectedItem ? 'true' : 'false'}
            >
                <button type="button" className="p-link border-none bg-transparent flex align-items-start gap-1 flex-1 text-left" style={{ minWidth: 0 }} data-cy={`tree-label-${dataCyKey}`} onClick={() => onSelect(item)} onContextMenu={(event) => onContextMenu?.(event, item)}>
                    <i className={item.loading ? 'pi pi-spinner pi-spin' : item.icon} style={{ color: selectedItem ? '#2e5fbd' : '#4a5568', fontSize: '14px', width: '18px', height: '14px', lineHeight: '14px', marginTop: '1px' }} />
                    <span className="font-medium flex-1" style={{ fontSize: '12.2px', lineHeight: '14.4px', whiteSpace: 'normal', wordBreak: 'break-word', color: selectedItem ? '#2e5fbd' : '#3f475d' }}>
                        {item.label}
                    </span>
                </button>
                <div className="flex align-items-start justify-content-end flex-shrink-0 gap-1" style={{ width: item.url ? '2.75rem' : '1.2rem' }}>
                    {hasChildren ? (
                        <button
                            type="button"
                            className="p-link border-none bg-transparent flex align-items-center justify-content-center"
                            style={{ width: '1.15rem', height: '1.15rem', color: selectedItem ? '#2e5fbd' : '#4a5568' }}
                            aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            data-cy={`tree-toggle-${dataCyKey}`}
                            onClick={() => {
                                if (!expanded) onExpand?.(item);
                                onToggle(item);
                            }}
                        >
                            <i className={`pi ${expanded ? 'pi-angle-down' : 'pi-angle-right'}`} />
                        </button>
                    ) : null}
                    {item.url ? (
                        <button type="button" className="p-link border-none bg-transparent" style={{ width: '1.15rem', height: '1.15rem', color: selectedItem ? '#2e5fbd' : '#4a5568' }} data-cy={`tree-open-${dataCyKey}`} aria-label={`Open ${item.label}`} onClick={() => onOpenUrl?.(item)}>
                            <i className="pi pi-arrow-up-right" />
                        </button>
                    ) : null}
                </div>
            </div>
            {hasChildren && expanded ? (
                <ul className="list-none p-0 m-0">
                    {(item.items || []).map((child) => (
                        <TreeSidebarItem
                            key={`${child.treeContextKey || ''}-${child.id}`}
                            depth={depth + 1}
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
