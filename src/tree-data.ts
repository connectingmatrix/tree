import { organizationTreeContextKey, resolveContextRoute } from './context';
import { buildTreeNodeModels } from './model';
import { TreeNode, TreeNodeModel, TreePostRecord, TreeRootDefinition } from './types';

interface BuildTreeItemsInput {
    definitions: TreeRootDefinition[];
    rootsByContext: Record<string, TreeNode[]>;
    organizations: Array<{ id: string; name: string }>;
    loadingContextKeys: Record<string, boolean>;
    isOrganizationsLoading: boolean;
    readNodeActionUrl?: (node: TreeNode, contextKey: string, organizationId?: string | null) => string | undefined;
    readPostActionUrl?: (node: TreeNode, post: TreePostRecord, contextKey: string, organizationId?: string | null) => string | undefined;
}

const buildContentItems = (roots: TreeNode[], contextKey: string, organizationId?: string | null, readNodeActionUrl?: BuildTreeItemsInput['readNodeActionUrl'], readPostActionUrl?: BuildTreeItemsInput['readPostActionUrl']): TreeNodeModel[] =>
    buildTreeNodeModels(roots, {
        organizationId: organizationId || null,
        treeContextKey: contextKey,
        treeContextType: organizationId ? 'organization' : contextKey === 'global' ? 'global' : 'user',
        toChatUrl: (node) => readNodeActionUrl?.(node, contextKey, organizationId) || '',
        toPostChatUrl: (node, post) => readPostActionUrl?.(node, post, contextKey, organizationId) || ''
    });

const buildOrganizationGroup = (input: BuildTreeItemsInput): TreeNodeModel => ({
    id: 'group-orgs',
    label: 'Organisations',
    nodeType: 'group',
    icon: 'pi pi-fw pi-building',
    treeContextKey: 'organizations',
    loading: input.isOrganizationsLoading,
    items: input.organizations.map((organization) => {
        const contextKey = organizationTreeContextKey(organization.id);
        return {
            id: `group-org-${organization.id}`,
            label: organization.name,
            nodeType: 'group',
            icon: 'pi pi-fw pi-building',
            organizationId: organization.id,
            scope: 'u',
            treeContextType: 'organization',
            treeContextKey: contextKey,
            loading: Boolean(input.loadingContextKeys[contextKey]),
            canLazyLoadChildren: !(input.rootsByContext[contextKey] || []).length,
            to: resolveContextRoute('organization', organization.id),
            items: buildContentItems(input.rootsByContext[contextKey] || [], contextKey, organization.id, input.readNodeActionUrl, input.readPostActionUrl)
        };
    })
});

export const buildTreeItems = (input: BuildTreeItemsInput): TreeNodeModel[] =>
    input.definitions.map((definition) => {
        if (definition.kind === 'organization-root') {
            return buildOrganizationGroup(input);
        }
        const contextKey = definition.kind === 'global-root' ? 'global' : 'user';
        return {
            id: definition.kind === 'global-root' ? 'group-g' : 'group-u',
            label: definition.label || (definition.kind === 'global-root' ? 'Global Tree' : 'User Tree'),
            nodeType: 'group',
            icon: definition.icon || (definition.kind === 'global-root' ? 'pi pi-fw pi-globe' : 'pi pi-fw pi-user'),
            scope: definition.kind === 'global-root' ? 'g' : 'u',
            treeContextType: definition.kind === 'global-root' ? 'global' : 'user',
            treeContextKey: contextKey,
            loading: Boolean(input.loadingContextKeys[contextKey]),
            to: resolveContextRoute(definition.kind === 'global-root' ? 'global' : 'user'),
            items: buildContentItems(input.rootsByContext[contextKey] || [], contextKey, null, input.readNodeActionUrl, input.readPostActionUrl)
        };
    });

export const readOpenState = (expandedKeysByContext: Record<string, string[]>): Record<string, boolean> =>
    Object.values(expandedKeysByContext)
        .flat()
        .reduce<Record<string, boolean>>((result, key) => ({ ...result, [key]: true }), {});
