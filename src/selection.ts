import { TreeNode, TreeNodeModel, TreeScope, TreeSelection } from './types';

export const readTreeSelectionForModel = (contextKey: string, item: TreeNodeModel): TreeSelection => ({
    id: item.id,
    nodeType: item.nodeType,
    treeContextKey: contextKey,
    scope: item.scope,
    organizationId: item.organizationId || null,
    subjectId: item.subjectId,
    pathIds: item.pathIds || []
});

export const readTreeSelectionForNode = (contextKey: string, node: TreeNode, organizationId?: string | null): TreeSelection => ({
    id: node.id,
    nodeType: node.nodeType,
    treeContextKey: contextKey,
    scope: node.scope,
    organizationId: organizationId || null,
    pathIds: node.pathSegments.map((segment) => segment.id)
});

export const readTreeSelectionForPost = (args: {
    contextKey: string;
    id: string;
    scope?: TreeScope;
    organizationId?: string | null;
    subjectId?: string;
    pathIds?: string[];
}): TreeSelection => ({
    id: args.id,
    nodeType: 'post',
    treeContextKey: args.contextKey,
    scope: args.scope,
    organizationId: args.organizationId || null,
    subjectId: args.subjectId,
    pathIds: args.pathIds || []
});
