import { TreeIndex, TreeNodeRecord } from "./types";

export const readTreeNodeKey = (contextKey: string, nodeId: string): string =>
  `${contextKey}:${nodeId}`;

const readNode = <T extends TreeNodeRecord>(
  node: T,
  parentId: string | null,
  pathIds: string[],
  depth: number
): T => {
  const children = node.children.map((child) =>
    readNode(child as T, node.id, [...pathIds, node.id], depth + 1)
  );
  const state = {
    load: node.state.load || "loading-done",
    expand: node.state.expand || (children.length ? "collapsed" : "expanded"),
  };
  const contextState = {
    ...node.contextState,
    visible: node.contextState.visible === false ? false : true,
  };

  return {
    ...node,
    parentId,
    depth,
    pathIds: [...pathIds, node.id],
    children,
    childCount:
      typeof node.childCount === "number" ? node.childCount : children.length,
    properties: node.properties || {},
    state,
    contextState,
    editable: node.editable !== false,
    locked: node.locked === true,
    visible: node.visible !== false,
    showCheckbox: node.showCheckbox === true,
  };
};

export const normalizeTreeNodes = <T extends TreeNodeRecord>(nodes: T[]): T[] =>
  nodes.map((node) => readNode(node, null, [], 0));

export const createEmptyTreeIndex = <
  T extends TreeNodeRecord
>(): TreeIndex<T> => ({
  rootsByContext: {},
  nodeByContextId: new Map<string, T>(),
  nodeById: new Map<string, T>(),
  childrenByParentId: new Map<string, T[]>(),
});

const writeIndex = <T extends TreeNodeRecord>(
  index: TreeIndex<T>,
  contextKey: string,
  node: T
): void => {
  index.nodeByContextId.set(readTreeNodeKey(contextKey, node.id), node);
  index.nodeById.set(node.id, node);
  const parentKey = node.parentId || "";
  const children = index.childrenByParentId.get(parentKey) || [];
  index.childrenByParentId.set(parentKey, [...children, node]);
  node.children.forEach((child) => writeIndex(index, contextKey, child as T));
};

export const buildTreeIndex = <T extends TreeNodeRecord>(
  rootsByContext: Record<string, T[]>
): TreeIndex<T> => {
  const index = createEmptyTreeIndex<T>();
  index.rootsByContext = rootsByContext;
  Object.entries(rootsByContext).forEach(([contextKey, roots]) =>
    roots.forEach((node) => writeIndex(index, contextKey, node))
  );
  return index;
};
