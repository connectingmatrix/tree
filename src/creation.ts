import { buildNodeUrl, toSlug } from './path';
import { TreeNode, TreeNodeType, TreePathSegment, TreeScope } from './types';

export interface BuildCreatedNodeInput {
    id: string;
    name: string;
    description?: string | null;
    slug?: string | null;
    nodeType: TreeNodeType;
    scope: TreeScope;
    parent: TreeNode | null;
}

export const buildCreatedTreeNode = (input: BuildCreatedNodeInput): TreeNode => {
    const parentSegments = input.parent?.pathSegments || [];
    const segment: TreePathSegment = {
        type: input.nodeType,
        slug: toSlug(input.slug || input.name),
        id: input.id,
        label: input.name
    };

    const pathSegments = [...parentSegments, segment];

    return {
        id: input.id,
        scope: input.scope,
        nodeType: input.nodeType,
        name: input.name,
        slug: segment.slug,
        description: input.description || '',
        url: buildNodeUrl(input.scope, pathSegments),
        parentId: input.parent?.id || null,
        depth: (input.parent?.depth || -1) + 1,
        pathSegments,
        children: [],
        posts: []
    };
};

export const hydrateCreatedNodeFromMutation = (args: {
    fallbackName: string;
    fallbackDescription?: string | null;
    nodeType: TreeNodeType;
    scope: TreeScope;
    parent: TreeNode | null;
    node: Partial<TreeNode> & { id: string };
}): TreeNode => {
    return buildCreatedTreeNode({
        id: args.node.id,
        name: args.node.name || args.fallbackName,
        description: args.node.description || args.fallbackDescription || '',
        slug: args.node.slug || null,
        nodeType: args.node.nodeType || args.nodeType,
        scope: args.node.scope || args.scope,
        parent: args.parent
    });
};
