import { buildNodeUrl, buildPathKeyFromSegments, toSlug } from './path';
import { NormalizeTreeNodesInput, RawTreeNode, TreeIndex, TreeNode, TreeNodeType, TreePathSegment, TreeScope } from './types';

export const toTreeNodeType = (type: RawTreeNode['nodeType']): TreeNodeType => {
    if (type === 'CHANNEL') {
        return 'channel';
    }

    if (type === 'CATEGORY') {
        return 'category';
    }

    return 'subject';
};

export const scopedIdKey = (scope: TreeScope, id: string): string => `${scope}:${id}`;

export const scopedPathKey = (scope: TreeScope, pathKey: string): string => `${scope}:${pathKey}`;

const buildTreeNodesRecursive = (args: {
    scope: TreeScope;
    rawNodes: RawTreeNode[];
    parentId: string | null;
    parentSegments: TreePathSegment[];
    depth: number;
}): TreeNode[] => {
    const usedSiblingSlugs = new Set<string>();

    return (args.rawNodes || []).map((rawNode) => {
        const nodeType = toTreeNodeType(rawNode.nodeType);
        const baseSlug = rawNode.slug ? toSlug(rawNode.slug) : toSlug(rawNode.name || rawNode.id);
        let slug = baseSlug;
        let duplicateCount = 2;

        while (usedSiblingSlugs.has(slug)) {
            slug = `${baseSlug}-${duplicateCount}`;
            duplicateCount += 1;
        }

        usedSiblingSlugs.add(slug);

        const segment: TreePathSegment = {
            type: nodeType,
            slug,
            id: rawNode.id,
            label: rawNode.name || rawNode.slug || rawNode.id
        };

        const pathSegments = [...args.parentSegments, segment];
        const node: TreeNode = {
            id: rawNode.id,
            scope: args.scope,
            nodeType,
            name: rawNode.name || rawNode.slug || rawNode.id,
            slug,
            description: rawNode.description || '',
            url: buildNodeUrl(args.scope, pathSegments),
            parentId: args.parentId,
            depth: args.depth,
            pathSegments,
            children: [],
            posts: rawNode.posts || []
        };

        node.children = buildTreeNodesRecursive({
            scope: args.scope,
            rawNodes: rawNode.children || [],
            parentId: node.id,
            parentSegments: pathSegments,
            depth: args.depth + 1
        });

        return node;
    });
};

export const normalizeTreeNodes = (input: NormalizeTreeNodesInput): TreeNode[] => {
    return buildTreeNodesRecursive({
        scope: input.scope,
        rawNodes: input.rawNodes || [],
        parentId: null,
        parentSegments: [],
        depth: 0
    });
};

export const createEmptyTreeIndex = (): TreeIndex => ({
    rootsByScope: {
        u: [],
        g: []
    },
    nodeByScopedId: new Map<string, TreeNode>(),
    nodeByScopedPath: new Map<string, TreeNode>(),
    subjectNodeByScopedId: new Map<string, TreeNode>()
});

const indexTreeNode = (index: TreeIndex, node: TreeNode): void => {
    index.nodeByScopedId.set(scopedIdKey(node.scope, node.id), node);
    index.nodeByScopedPath.set(scopedPathKey(node.scope, buildPathKeyFromSegments(node.pathSegments)), node);

    if (node.nodeType === 'subject') {
        index.subjectNodeByScopedId.set(scopedIdKey(node.scope, node.id), node);
    }

    node.children.forEach((child) => indexTreeNode(index, child));
};

export const buildTreeIndex = (rootsByScope: Record<TreeScope, TreeNode[]>): TreeIndex => {
    const index = createEmptyTreeIndex();
    index.rootsByScope.u = rootsByScope.u || [];
    index.rootsByScope.g = rootsByScope.g || [];

    index.rootsByScope.u.forEach((node) => indexTreeNode(index, node));
    index.rootsByScope.g.forEach((node) => indexTreeNode(index, node));

    return index;
};
