import { TreeNodeType, TreePathSegment, TreeScope } from './types';

export const toSlug = (value: string): string => {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || 'node';
};

export const nodeTypeToSegment = (type: TreeNodeType): 'channel' | 'category' | 'subject' => {
    if (type === 'channel') {
        return 'channel';
    }
    if (type === 'category') {
        return 'category';
    }
    return 'subject';
};

export const buildPathKeyFromSegments = (segments: Array<{ type: TreeNodeType; slug: string }>): string => {
    return segments.map((segment) => `${nodeTypeToSegment(segment.type)}/${segment.slug}`).join('/');
};

export const buildNodeUrl = (scope: TreeScope, segments: TreePathSegment[], postId?: string): string => {
    const path = segments.map((segment) => `${nodeTypeToSegment(segment.type)}/${segment.slug}`).join('/');

    if (!path) {
        return `/${scope}`;
    }

    if (postId) {
        return `/${scope}/${path}/post/${encodeURIComponent(postId)}`;
    }

    return `/${scope}/${path}`;
};

export const sanitizeSlugToken = (value: string): string => {
    try {
        return encodeURIComponent(decodeURIComponent(value));
    } catch {
        return encodeURIComponent(value);
    }
};
