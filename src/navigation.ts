import { resolveContextRoute, resolveTreePathForOrganization } from './context';
import { TreeContextType, TreeNode, TreeScope } from './types';

export const resolveScopeRootUrl = (scope: TreeScope, organizationId?: string | null): string => {
    if (organizationId) {
        return resolveContextRoute('organization', organizationId);
    }

    return scope === 'g' ? '/g' : '/u';
};

export const resolveNodeNavigationUrl = (node: Pick<TreeNode, 'url' | 'scope'>, organizationId?: string | null): string => {
    return resolveTreePathForOrganization(node.url, organizationId);
};

export const resolveCreatedNodeNavigation = (args: {
    createdNode: Pick<TreeNode, 'url' | 'scope'>;
    organizationId?: string | null;
    contextType?: TreeContextType;
}): string => {
    if (args.contextType === 'organization' || args.organizationId) {
        return resolveTreePathForOrganization(args.createdNode.url, args.organizationId || null);
    }

    if (args.contextType === 'global') {
        return args.createdNode.scope === 'g' ? args.createdNode.url : args.createdNode.url.replace(/^\/u\//, '/g/');
    }

    return args.createdNode.url;
};
