import { buildPathKeyFromSegments, sanitizeSlugToken } from './path';
import { TreeNode, TreeNodeType, TreeRouteResolution, TreeScope } from './types';
import { scopedPathKey } from './normalize';

interface ParsedPath {
    pathKey: string;
    pathSegments: Array<{ type: TreeNodeType; slug: string }>;
    postId: string | null;
    isRoot: boolean;
}

const normalizeToken = (value: string): string => value.trim().toLowerCase();

export const parseScopedWildcardPath = (wildcardPath?: string): ParsedPath => {
    const raw = wildcardPath || '';
    const tokens = raw
        .split('/')
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => normalizeToken(token));

    if (tokens.length === 0) {
        return {
            pathKey: '',
            pathSegments: [],
            postId: null,
            isRoot: true
        };
    }

    const segments: Array<{ type: TreeNodeType; slug: string }> = [];
    let index = 0;
    let postId: string | null = null;

    while (index < tokens.length) {
        const kind = tokens[index];

        if (kind === 'post') {
            postId = tokens[index + 1] || null;
            break;
        }

        const slug = tokens[index + 1] || '';
        if (!slug) {
            break;
        }

        if (kind === 'channel' || kind === 'category' || kind === 'subject') {
            segments.push({
                type: kind,
                slug: sanitizeSlugToken(slug)
            });
        }

        index += 2;
    }

    return {
        pathKey: buildPathKeyFromSegments(segments),
        pathSegments: segments,
        postId,
        isRoot: false
    };
};

export const resolveTreeRoute = (args: { scope: TreeScope; wildcardPath: string | undefined; roots: TreeNode[]; nodeByScopedPath: Map<string, TreeNode> }): TreeRouteResolution => {
    const parsed = parseScopedWildcardPath(args.wildcardPath);
    if (parsed.isRoot) {
        return {
            scope: args.scope,
            node: null,
            postId: null,
            post: null,
            pathSegments: [],
            isRoot: true
        };
    }

    const node = args.nodeByScopedPath.get(scopedPathKey(args.scope, parsed.pathKey)) || null;
    const post = parsed.postId && node ? node.posts.find((item) => item.id === parsed.postId) || null : null;

    return {
        scope: args.scope,
        node,
        postId: parsed.postId,
        post,
        pathSegments: (node?.pathSegments || []).map((segment) => ({ ...segment })),
        isRoot: false
    };
};
