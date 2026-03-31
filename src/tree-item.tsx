import React from 'react';
import { NodeRendererProps } from 'react-arborist';
import { TreeNodeModel } from './types';

interface TreeItemProps extends NodeRendererProps<TreeNodeModel> {
    onContextMenu?: (event: React.MouseEvent<HTMLElement>, item: TreeNodeModel) => void;
    onExpand?: (item: TreeNodeModel) => void;
    onOpenUrl?: (item: TreeNodeModel) => void;
    onSelect?: (item: TreeNodeModel) => void;
    selectedItemId?: string;
    toggleExpanded?: (contextKey: string, itemId: string) => void;
}

const readDataCyKey = (contextKey: string, item: TreeNodeModel): string => `${contextKey}-${item.nodeType}-${item.id}`.replace(/[^a-zA-Z0-9_-]/g, '-');

export const TreeItem = ({ node, tree, style, dragHandle, onContextMenu, onExpand, onOpenUrl, onSelect, selectedItemId, toggleExpanded }: TreeItemProps) => {
    const item = node.data;
    const hasChildren = Boolean(item.items?.length || item.canLazyLoadChildren);
    const contextKey = item.treeContextKey || 'user';
    const dataCyKey = readDataCyKey(contextKey, item);
    const rowStyle = { ...style };
    const indent = parseFloat(String(rowStyle.paddingLeft || 0)) || 0;
    const width = `calc(100% - ${indent}px)`;
    const isSelected = selectedItemId === item.id;
    const level = `${node.level + 1}`;
    const expanded = hasChildren && node.isOpen ? 'true' : 'false';
    delete rowStyle.paddingLeft;

    return (
        <div ref={dragHandle} style={rowStyle}>
            <div
                className={`flex align-items-center gap-2 transition-colors transition-duration-150 ${isSelected ? 'text-900' : 'text-700 hover:surface-hover'}`}
                style={{
                    marginLeft: `${indent}px`,
                    width,
                    maxWidth: width,
                    minHeight: '24px',
                    padding: '2px 4px',
                    borderRadius: '10px',
                    background: isSelected ? '#edf4ff' : 'transparent'
                }}
                data-cy={`tree-row-${dataCyKey}`}
                data-tree-context={contextKey}
                data-tree-expanded={expanded}
                data-tree-level={level}
                data-tree-node-id={item.id}
                data-tree-node-type={item.nodeType}
            >
                <button
                    type="button"
                    className="p-link border-none bg-transparent flex align-items-center gap-1 flex-1 text-left"
                    style={{ minWidth: 0 }}
                    data-cy={`tree-label-${dataCyKey}`}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onSelect?.(item);
                    }}
                    onContextMenu={(event) => onContextMenu?.(event, item)}
                >
                    <i className={item.loading ? 'pi pi-spinner pi-spin' : item.icon} style={{ color: isSelected ? '#2e5fbd' : '#4a5568', fontSize: '14px', width: '18px', height: '14px', lineHeight: '14px' }} />
                    <span
                        className="font-medium flex-1"
                        style={{
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            fontSize: '12.2px',
                            lineHeight: '12.8px',
                            color: isSelected ? '#2e5fbd' : '#3f475d'
                        }}
                    >
                        {item.label}
                    </span>
                </button>
                <div className="flex align-items-center justify-content-end flex-shrink-0 gap-1" style={{ width: item.url ? '2.75rem' : '1.2rem' }}>
                    {hasChildren ? (
                        <button
                            type="button"
                            className="p-link border-none bg-transparent flex align-items-center justify-content-center"
                            style={{ width: '1.15rem', height: '1.15rem', color: isSelected ? '#2e5fbd' : '#4a5568' }}
                            aria-label={node.isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            data-cy={`tree-toggle-${dataCyKey}`}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (!node.isOpen) onExpand?.(item);
                                toggleExpanded?.(contextKey, item.id);
                            }}
                        >
                            <i className={`pi ${node.isOpen ? 'pi-angle-down' : 'pi-angle-right'}`} />
                        </button>
                    ) : null}
                    {item.url ? (
                        <button
                            type="button"
                            className="p-link border-none bg-transparent"
                            style={{ width: '1.15rem', height: '1.15rem', color: isSelected ? '#2e5fbd' : '#4a5568' }}
                            data-cy={`tree-open-${dataCyKey}`}
                            aria-label={`Open ${item.label}`}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onOpenUrl?.(item);
                            }}
                        >
                            <i className="pi pi-arrow-up-right" />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
