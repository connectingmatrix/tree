import { TreeNode, TreeNodeModel } from './types';
import { BuildTreeNodeModelOptions } from './types';

const resolveIcon = (nodeType: TreeNode['nodeType']): string => {
    if (nodeType === 'channel') {
        return 'pi pi-fw pi-sitemap';
    }

    if (nodeType === 'category') {
        return 'pi pi-fw pi-folder';
    }

    return 'pi pi-fw pi-folder-open';
};

export const buildTreeNodeModels = (nodes: TreeNode[], options: BuildTreeNodeModelOptions, parent?: TreeNode): TreeNodeModel[] => {
    const resolveTreePath = options.resolveTreePath || ((path: string) => path);
    const loadingNodeIds = options.loadingNodeIds || new Set<string>();

    return nodes
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((node) => {
            const children = buildTreeNodeModels(node.children, options, node);
            const posts: TreeNodeModel[] =
                node.nodeType === 'subject'
                    ? node.posts
                          .slice()
                          .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
                          .map((post) => ({
                              id: post.id,
                              label: post.title || 'Untitled Post',
                              nodeType: 'post',
                              icon: 'pi pi-fw pi-file',
                              subjectId: node.id,
                              parentNodeId: node.id,
                              parentNodeType: 'subject',
                              scope: node.scope,
                              organizationId: options.organizationId || null,
                              treeContextType: options.treeContextType,
                              treeContextKey: options.treeContextKey,
                              to: resolveTreePath(`${node.url}/post/${encodeURIComponent(post.id)}`),
                              url: options.toPostChatUrl?.(node, post)
                          }))
                    : [];

            return {
                id: node.id,
                label: node.name,
                nodeType: node.nodeType,
                icon: resolveIcon(node.nodeType),
                loading: loadingNodeIds.has(node.id),
                parentNodeId: parent?.id,
                parentNodeType: parent?.nodeType,
                scope: node.scope,
                organizationId: options.organizationId || null,
                treeContextType: options.treeContextType,
                treeContextKey: options.treeContextKey,
                to: resolveTreePath(node.url),
                url: options.toChatUrl?.(node),
                items: [...children, ...posts]
            };
        });
};
