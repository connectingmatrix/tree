import { TreeChange, TreeMatch, TreeNodeRecord } from "./types";

const cloneNode = <T extends TreeNodeRecord>(node: T): T => ({
  ...node,
  children: node.children.map((child) => cloneNode(child as T)),
});
const cloneTree = <T extends TreeNodeRecord>(roots: T[]): T[] =>
  roots.map((root) => cloneNode(root));
const readMatch = <T extends TreeNodeRecord>(
  node: T,
  match: TreeMatch<T>
): boolean => (typeof match === "string" ? node.id === match : match(node));

export const findNodeById = <T extends TreeNodeRecord>(
  roots: T[],
  nodeId: string
): T | null => {
  const stack = [...roots];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue;
    if (node.id === nodeId) return node;
    stack.push(...(node.children as T[]));
  }
  return null;
};

export const hasNodeInTree = <T extends TreeNodeRecord>(
  roots: T[],
  nodeId: string
): boolean => Boolean(findNodeById(roots, nodeId));

export const findTreeChild = <T extends TreeNodeRecord>(
  roots: T[],
  nodeId: string | null,
  match: TreeMatch<T>
): T | null => {
  const children = nodeId ? findNodeById(roots, nodeId)?.children || [] : roots;
  const stack = [...(children as T[])];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue;
    if (readMatch(node, match)) return node;
    stack.push(...(node.children as T[]));
  }
  return null;
};

export const findTreeParent = <T extends TreeNodeRecord>(
  roots: T[],
  nodeId: string,
  match: TreeMatch<T>
): T | null => {
  let current = findNodeById(roots, nodeId);
  while (current && current.parentId) {
    current = findNodeById(roots, current.parentId);
    if (current && readMatch(current, match)) return current;
  }
  return null;
};

const removeNode = <T extends TreeNodeRecord>(
  roots: T[],
  nodeId: string
): T[] => {
  const nextRoots: T[] = [];
  roots.forEach((node) => {
    if (node.id === nodeId) return;
    nextRoots.push({
      ...node,
      children: removeNode(node.children as T[], nodeId),
    });
  });
  return nextRoots;
};

const insertNode = <T extends TreeNodeRecord>(
  roots: T[],
  parentId: string | null,
  node: T
): T[] => {
  if (!parentId) return [...roots, node];
  let inserted = false;
  const nextRoots = roots.map((root) => {
    if (root.id === parentId) {
      inserted = true;
      return { ...root, children: [...(root.children as T[]), node] };
    }
    const children = insertNode(root.children as T[], parentId, node);
    inserted = inserted || hasNodeInTree(children, node.id);
    return { ...root, children };
  });
  return inserted ? nextRoots : roots;
};

const detachNode = <T extends TreeNodeRecord>(
  roots: T[],
  nodeId: string
): { detached: T | null; roots: T[] } => {
  let detached: T | null = null;
  const nextRoots: T[] = [];
  roots.forEach((node) => {
    if (node.id === nodeId) {
      detached = node;
      return;
    }
    const childResult = detachNode(node.children as T[], nodeId);
    if (!detached && childResult.detached) detached = childResult.detached;
    nextRoots.push({ ...node, children: childResult.roots });
  });
  return { detached, roots: nextRoots };
};

const rebaseNode = <T extends TreeNodeRecord>(
  node: T,
  parentId: string | null,
  pathIds: string[],
  depth: number
): T => {
  const children = node.children.map((child) =>
    rebaseNode(child as T, node.id, [...pathIds, node.id], depth + 1)
  );
  return { ...node, parentId, pathIds: [...pathIds, node.id], depth, children };
};

export const applyTreePatchOperations = <T extends TreeNodeRecord>(
  roots: T[],
  input: TreeChange<T>[]
): T[] => {
  let nextRoots = cloneTree(roots);
  input.forEach((change) => {
    if (change.kind === "insert-node")
      nextRoots = insertNode(
        nextRoots,
        change.parentId,
        cloneNode(change.node)
      );
    if (change.kind === "remove-node")
      nextRoots = removeNode(nextRoots, change.nodeId);
    if (change.kind === "replace-node")
      nextRoots = nextRoots.map((node) =>
        node.id === change.nodeId
          ? cloneNode(change.node)
          : {
              ...node,
              children: applyTreePatchOperations(node.children as T[], [
                change,
              ]),
            }
      );
    if (change.kind === "set-children")
      nextRoots = nextRoots.map((node) =>
        node.id === change.nodeId
          ? {
              ...node,
              children: change.children.map((child) => cloneNode(child)),
            }
          : {
              ...node,
              children: applyTreePatchOperations(node.children as T[], [
                change,
              ]),
            }
      );
    if (change.kind === "update-node")
      nextRoots = nextRoots.map((node) =>
        node.id === change.nodeId
          ? { ...node, ...change.changes }
          : {
              ...node,
              children: applyTreePatchOperations(node.children as T[], [
                change,
              ]),
            }
      );
    if (change.kind === "move-node") {
      const detached = detachNode(nextRoots, change.nodeId);
      const parent = change.parentId
        ? findNodeById(detached.roots, change.parentId)
        : null;
      if (detached.detached)
        nextRoots = insertNode(
          detached.roots,
          change.parentId,
          rebaseNode(
            detached.detached,
            change.parentId,
            parent ? parent.pathIds : [],
            parent ? parent.depth + 1 : 0
          )
        );
    }
  });
  return nextRoots;
};
