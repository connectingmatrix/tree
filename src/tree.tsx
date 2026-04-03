import React, { useRef } from "react";
import { TreeSidebarItem } from "./sidebar-item";
import { TreeNodeModel, TreeNodeRecord, TreeSelection } from "./types";

interface TreeProps<T extends TreeNodeRecord> {
  activeContextKey: string;
  className?: string;
  expandedKeysByContext: Record<string, string[]>;
  items: TreeNodeModel<T>[];
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
  selectedByContext: Record<string, TreeSelection | undefined>;
  toggleExpanded: (item: TreeNodeModel<T>) => void;
}

export const Tree = <T extends TreeNodeRecord>({
  activeContextKey,
  className,
  expandedKeysByContext,
  items,
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
  selectedByContext,
  toggleExpanded,
}: TreeProps<T>) => {
  const dragItemRef = useRef<TreeNodeModel<T> | null>(null);
  const activeSelection = selectedByContext[activeContextKey] || null;
  return (
    <div
      className={
        className || "h-full w-full min-h-0 overflow-y-auto overflow-x-hidden"
      }
      data-cy="tree-root"
    >
      <ul className="list-none p-0 m-0">
        {items.map((item) => (
          <TreeSidebarItem
            key={`${item.contextKey}-${item.id}`}
            activeContextKey={activeContextKey}
            activeSelection={activeSelection}
            depth={0}
            dragItemRef={dragItemRef}
            expandedKeysByContext={expandedKeysByContext}
            item={item}
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
            onToggle={toggleExpanded}
          />
        ))}
      </ul>
    </div>
  );
};
