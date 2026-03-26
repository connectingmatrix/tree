import { buildNodeUrl } from './path';
import { TreeNode, TreePatchOperation } from './types';

const cloneNode = (node: TreeNode): TreeNode => ({
    ...node,
    pathSegments: [...node.pathSegments],
    posts: [...node.posts],
    children: node.children.map((child) => cloneNode(child))
});

const cloneTree = (roots: TreeNode[]): TreeNode[] => roots.map((root) => cloneNode(root));

const findNodeById = (roots: TreeNode[], nodeId: string): TreeNode | null => {
    const stack = [...roots];

    while (stack.length > 0) {
        const node = stack.shift();
        if (!node) {
            continue;
        }

        if (node.id === nodeId) {
            return node;
        }

        stack.push(...node.children);
    }

    return null;
};

const removeNodeById = (roots: TreeNode[], nodeId: string): TreeNode[] => {
    const removeRecursive = (nodes: TreeNode[]): TreeNode[] => {
        const filtered = nodes.filter((node) => node.id !== nodeId);

        return filtered.map((node) => ({
            ...node,
            children: removeRecursive(node.children)
        }));
    };

    return removeRecursive(roots);
};

const removePostById = (roots: TreeNode[], subjectId: string, postId: string): TreeNode[] => {
    const updateRecursive = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((node) => {
            const nextNode: TreeNode = {
                ...node,
                children: updateRecursive(node.children)
            };

            if (node.id === subjectId) {
                nextNode.posts = node.posts.filter((post) => post.id !== postId);
            }

            return nextNode;
        });
    };

    return updateRecursive(roots);
};

const insertNode = (roots: TreeNode[], parentId: string | null, node: TreeNode): TreeNode[] => {
    if (findNodeById(roots, node.id)) {
        return roots;
    }

    if (!parentId) {
        return [...roots, node];
    }

    let inserted = false;
    const insertRecursive = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((current) => {
            if (current.id === parentId) {
                inserted = true;
                return {
                    ...current,
                    children: [...current.children, node]
                };
            }

            return {
                ...current,
                children: insertRecursive(current.children)
            };
        });
    };

    const nextRoots = insertRecursive(roots);

    if (inserted) {
        return nextRoots;
    }

    return [...nextRoots, node];
};

const detachNode = (roots: TreeNode[], nodeId: string): { roots: TreeNode[]; detached: TreeNode | null } => {
    let detached: TreeNode | null = null;

    const removeRecursive = (nodes: TreeNode[]): TreeNode[] => {
        const nextNodes: TreeNode[] = [];

        nodes.forEach((node) => {
            if (node.id === nodeId) {
                detached = node;
                return;
            }

            nextNodes.push({
                ...node,
                children: removeRecursive(node.children)
            });
        });

        return nextNodes;
    };

    return {
        roots: removeRecursive(roots),
        detached
    };
};

const rebaseSubtree = (node: TreeNode, parent: TreeNode | null): TreeNode => {
    const parentSegments = parent?.pathSegments || [];
    const segment = {
        type: node.nodeType,
        slug: node.slug,
        id: node.id,
        label: node.name
    };
    const pathSegments = [...parentSegments, segment];

    const rebasedNode: TreeNode = {
        ...node,
        scope: parent?.scope || node.scope,
        parentId: parent?.id || null,
        depth: (parent?.depth || -1) + 1,
        pathSegments,
        url: buildNodeUrl(parent?.scope || node.scope, pathSegments),
        children: []
    };

    rebasedNode.children = node.children.map((child) => rebaseSubtree(child, rebasedNode));

    return rebasedNode;
};

const moveNode = (roots: TreeNode[], nodeId: string, targetParentId: string | null): TreeNode[] => {
    const detachedResult = detachNode(roots, nodeId);
    if (!detachedResult.detached) {
        return roots;
    }

    if (!targetParentId) {
        const rebased = rebaseSubtree(detachedResult.detached, null);
        return [...detachedResult.roots, rebased];
    }

    const targetParent = findNodeById(detachedResult.roots, targetParentId);
    if (!targetParent) {
        return insertNode(detachedResult.roots, null, rebaseSubtree(detachedResult.detached, null));
    }

    const rebased = rebaseSubtree(detachedResult.detached, targetParent);
    return insertNode(detachedResult.roots, targetParentId, rebased);
};

export const hasNodeInTree = (roots: TreeNode[], nodeId: string): boolean => Boolean(findNodeById(roots, nodeId));

export const hasPostInTree = (roots: TreeNode[], subjectId: string, postId: string): boolean => {
    const subjectNode = findNodeById(roots, subjectId);

    if (!subjectNode) {
        return false;
    }

    return subjectNode.posts.some((post) => post.id === postId);
};

export const applyTreePatchOperations = (roots: TreeNode[], operations: TreePatchOperation[]): TreeNode[] => {
    if (!operations.length) {
        return roots;
    }

    let nextRoots = cloneTree(roots);

    operations.forEach((operation) => {
        if (operation.kind === 'create-node') {
            nextRoots = insertNode(nextRoots, operation.parentId, cloneNode(operation.node));
            return;
        }

        if (operation.kind === 'delete-node') {
            nextRoots = removeNodeById(nextRoots, operation.nodeId);
            return;
        }

        if (operation.kind === 'delete-post') {
            nextRoots = removePostById(nextRoots, operation.subjectId, operation.postId);
            return;
        }

        if (operation.kind === 'move-node') {
            nextRoots = moveNode(nextRoots, operation.nodeId, operation.targetParentId);
            return;
        }

        if (operation.kind === 'link-category-to-channel') {
            nextRoots = moveNode(nextRoots, operation.categoryId, operation.channelId);
            return;
        }

        nextRoots = moveNode(nextRoots, operation.subjectId, operation.categoryId);
    });

    return nextRoots;
};
