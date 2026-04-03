import React from "react";
import { TreeNodeModel, TreeNodeRecord, TreeSelection } from "./types";

interface TreeSidebarItemProps<T extends TreeNodeRecord> {
  activeContextKey: string;
  activeSelection: TreeSelection | null;
  depth: number;
  dragItemRef: React.MutableRefObject<TreeNodeModel<T> | null>;
  expandedKeysByContext: Record<string, string[]>;
  item: TreeNodeModel<T>;
  onCheckChange?: (item: TreeNodeModel<T>, checked: boolean) => void;
  onCollapse?: (item: TreeNodeModel<T>) => void;
  onDoubleClick?: (
    item: TreeNodeModel<T>,
    event: React.MouseEvent<HTMLElement>
  ) => void;
  onDragStart?: (
    item: TreeNodeModel<T>,
    event: React.DragEvent<HTMLElement>
  ) => void;
  onDrop?: (
    source: TreeNodeModel<T>,
    target: TreeNodeModel<T>,
    event: React.DragEvent<HTMLElement>
  ) => void;
  onExpand?: (item: TreeNodeModel<T>) => void;
  onFetchSubTree?: (item: TreeNodeModel<T>) => void;
  onLazyLoad?: (item: TreeNodeModel<T>) => void;
  onLeftClick?: (
    item: TreeNodeModel<T>,
    event: React.MouseEvent<HTMLElement>
  ) => void;
  onOpenUrl?: (item: TreeNodeModel<T>) => void;
  onRightClick?: (
    event: React.MouseEvent<HTMLElement>,
    item: TreeNodeModel<T>
  ) => void;
  onSelect?: (item: TreeNodeModel<T>) => void;
  onToggle: (item: TreeNodeModel<T>) => void;
}

const readDataCyKey = <T extends TreeNodeRecord>(
  item: TreeNodeModel<T>
): string =>
  `${item.contextKey}-${item.kind}-${item.id}`.replace(/[^a-zA-Z0-9_-]/g, "-");

export const TreeSidebarItem = <T extends TreeNodeRecord>({
  activeContextKey,
  activeSelection,
  depth,
  dragItemRef,
  expandedKeysByContext,
  item,
  onCheckChange,
  onCollapse,
  onDoubleClick,
  onDragStart,
  onDrop,
  onExpand,
  onFetchSubTree,
  onLazyLoad,
  onLeftClick,
  onOpenUrl,
  onRightClick,
  onSelect,
  onToggle,
}: TreeSidebarItemProps<T>) => {
  if (!item.visible || item.contextState.visible === false) return null;
  const hasChildren = Boolean(item.children.length || item.canLazyLoadChildren);
  const expanded = (expandedKeysByContext[item.contextKey] || []).includes(
    item.id
  );
  const selected =
    item.contextKey === activeContextKey &&
    activeSelection &&
    activeSelection.id === item.id &&
    activeSelection.itemType === item.itemType;
  const handleToggle = (): void => {
    if (!expanded) {
      if (item.canLazyLoadChildren && onLazyLoad) onLazyLoad(item);
      if (onFetchSubTree) onFetchSubTree(item);
      if (onExpand) onExpand(item);
    }
    if (expanded && onCollapse) onCollapse(item);
    onToggle(item);
  };

  return (
    <li className="list-none">
      <div
        className={`flex align-items-start gap-1 transition-colors transition-duration-150 ${
          selected
            ? "active-tree-node text-900"
            : "text-700 hover:surface-hover"
        }`}
        style={{
          marginLeft: `${depth * 21}px`,
          minHeight: "29px",
          padding: "7px 4px",
          borderRadius: "10px",
        }}
        data-cy={`tree-row-${readDataCyKey(item)}`}
        data-tree-context={item.contextKey}
        data-tree-node-id={item.id}
        data-tree-node-kind={item.kind}
        onDragOver={(event) => {
          if (!onDrop || item.locked || item.itemType === "range") return;
          event.preventDefault();
        }}
        onDrop={(event) => {
          const source = dragItemRef.current;
          if (
            !source ||
            !onDrop ||
            item.locked ||
            item.itemType === "range" ||
            source.id === item.id
          )
            return;
          event.preventDefault();
          onDrop(source, item, event);
          dragItemRef.current = null;
        }}
      >
        {item.showCheckbox ? (
          <input
            checked={item.checked}
            className="mt-1"
            disabled={item.locked}
            type="checkbox"
            onChange={(event) =>
              onCheckChange
                ? onCheckChange(item, event.target.checked)
                : undefined
            }
          />
        ) : null}
        <button
          type="button"
          className="p-link border-none bg-transparent flex align-items-start gap-1 flex-1 text-left"
          draggable={Boolean(
            onDragStart && !item.locked && item.itemType === "node"
          )}
          style={{ minWidth: 0 }}
          data-cy={`tree-label-${readDataCyKey(item)}`}
          onClick={(event) => {
            if (onLeftClick) onLeftClick(item, event);
            if (item.itemType === "range" && hasChildren) return handleToggle();
            if (onSelect) onSelect(item);
          }}
          onContextMenu={(event) =>
            onRightClick ? onRightClick(event, item) : undefined
          }
          onDoubleClick={(event) => {
            if (hasChildren) handleToggle();
            if (onDoubleClick) onDoubleClick(item, event);
          }}
          onDragStart={(event) => {
            if (!onDragStart || item.locked || item.itemType !== "node") return;
            dragItemRef.current = item;
            onDragStart(item, event);
          }}
          onDragEnd={() => {
            dragItemRef.current = null;
          }}
        >
          <i
            className={item.loading ? "pi pi-spinner pi-spin" : item.icon}
            style={{
              color: selected ? "#2e5fbd" : "#4a5568",
              fontSize: "14px",
              width: "18px",
              height: "14px",
              lineHeight: "14px",
              marginTop: "1px",
            }}
          />
          <span
            className="font-medium flex-1"
            style={{
              fontSize: "12.2px",
              lineHeight: "14.4px",
              whiteSpace: "normal",
              wordBreak: "break-word",
              color: selected ? "#2e5fbd" : "#3f475d",
            }}
          >
            {item.label}
          </span>
        </button>
        <div
          className="flex align-items-start justify-content-end flex-shrink-0 gap-1"
          style={{ width: item.url ? "2.75rem" : "1.2rem" }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="p-link border-none bg-transparent flex align-items-center justify-content-center"
              style={{
                width: "1.15rem",
                height: "1.15rem",
                color: selected ? "#2e5fbd" : "#4a5568",
              }}
              aria-label={
                expanded ? `Collapse ${item.label}` : `Expand ${item.label}`
              }
              data-cy={`tree-toggle-${readDataCyKey(item)}`}
              onClick={handleToggle}
            >
              <i
                className={`pi ${
                  expanded ? "pi-angle-down" : "pi-angle-right"
                }`}
              />
            </button>
          ) : null}
          {item.url ? (
            <button
              type="button"
              className="p-link border-none bg-transparent"
              style={{
                width: "1.15rem",
                height: "1.15rem",
                color: selected ? "#2e5fbd" : "#4a5568",
              }}
              data-cy={`tree-open-${readDataCyKey(item)}`}
              aria-label={`Open ${item.label}`}
              onClick={() => (onOpenUrl ? onOpenUrl(item) : undefined)}
            >
              <i className="pi pi-arrow-up-right" />
            </button>
          ) : null}
        </div>
      </div>
      {hasChildren && expanded ? (
        <ul className="list-none p-0 m-0">
          {item.children.map((child) => (
            <TreeSidebarItem
              key={`${child.contextKey}-${child.id}`}
              activeContextKey={activeContextKey}
              activeSelection={activeSelection}
              depth={depth + 1}
              dragItemRef={dragItemRef}
              expandedKeysByContext={expandedKeysByContext}
              item={child}
              onCheckChange={onCheckChange}
              onCollapse={onCollapse}
              onDoubleClick={onDoubleClick}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onExpand={onExpand}
              onFetchSubTree={onFetchSubTree}
              onLazyLoad={onLazyLoad}
              onLeftClick={onLeftClick}
              onOpenUrl={onOpenUrl}
              onRightClick={onRightClick}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};
