import { TreeContextType, TreeScope } from './types';

export const USER_TREE_MENU_KEY = 'group-u';

export const organizationTreeContextKey = (organizationId: string): string => `organization:${organizationId}`;

export const treeContextKeyForScope = (scope: TreeScope): string => (scope === 'g' ? 'global' : 'user');

export const treeContextTypeForScope = (scope: TreeScope): TreeContextType => (scope === 'g' ? 'global' : 'user');

export const resolveTreeContextTypeFromKey = (contextKey: string): TreeContextType => {
    if (contextKey.startsWith('organization:')) {
        return 'organization';
    }

    return contextKey === 'global' ? 'global' : 'user';
};

export const resolveOrganizationIdFromContextKey = (contextKey: string): string | null => {
    if (!contextKey.startsWith('organization:')) {
        return null;
    }

    return contextKey.replace(/^organization:/, '').trim() || null;
};

export const resolveRouteOrganizationId = (pathname: string): string | null => {
    const matched = pathname.match(/^\/org\/([^/]+)/);
    if (!matched?.[1]) {
        return null;
    }

    try {
        return decodeURIComponent(matched[1]);
    } catch {
        return matched[1];
    }
};

export const resolveTreeContextKeyFromPathname = (pathname: string): string => {
    const organizationId = resolveRouteOrganizationId(pathname);
    if (organizationId) {
        return organizationTreeContextKey(organizationId);
    }

    if (pathname.startsWith('/g')) {
        return 'global';
    }

    return 'user';
};

export const resolveTreeContextTypeFromPathname = (pathname: string): TreeContextType => {
    if (resolveRouteOrganizationId(pathname)) {
        return 'organization';
    }

    return pathname.startsWith('/g') ? 'global' : 'user';
};

export const resolveContextRoute = (contextType: TreeContextType, organizationId?: string | null): string => {
    if (contextType === 'organization' && organizationId) {
        return `/org/${encodeURIComponent(organizationId)}`;
    }

    if (contextType === 'global') {
        return '/g';
    }

    return '/u';
};

export const resolveTreePathForOrganization = (path: string, organizationId?: string | null): string => {
    const normalizedOrganizationId = organizationId?.trim() || null;
    if (!normalizedOrganizationId) {
        return path;
    }

    const orgPrefix = `/org/${encodeURIComponent(normalizedOrganizationId)}`;
    if (path === '/u') {
        return orgPrefix;
    }

    if (path.startsWith('/u/')) {
        return `${orgPrefix}${path.slice(2)}`;
    }

    return path;
};
