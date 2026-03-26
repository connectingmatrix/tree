import { describe, expect, it } from 'vitest';
import { buildTreeIndex, normalizeTreeNodes, scopedIdKey } from '../normalize';

describe('normalizeTreeNodes + buildTreeIndex', () => {
    it('normalizes raw tree nodes and indexes by scoped id/path', () => {
        const userRoots = normalizeTreeNodes({
            scope: 'u',
            rawNodes: [
                {
                    id: 'ch-1',
                    nodeType: 'CHANNEL',
                    name: 'Root Channel',
                    slug: 'root-channel',
                    children: [
                        {
                            id: 'cat-1',
                            nodeType: 'CATEGORY',
                            name: 'Category',
                            slug: 'category',
                            children: [
                                {
                                    id: 'sub-1',
                                    nodeType: 'SUBJECT',
                                    name: 'Subject',
                                    slug: 'subject',
                                    posts: [
                                        {
                                            id: 'post-1',
                                            subject_id: 'sub-1',
                                            title: 'P1',
                                            narrative: null,
                                            metadata: {},
                                            created_at: null,
                                            updated_at: null
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        const index = buildTreeIndex({
            u: userRoots,
            g: []
        });

        expect(userRoots).toHaveLength(1);
        expect(index.nodeByScopedId.get(scopedIdKey('u', 'ch-1'))?.name).toBe('Root Channel');
        expect(index.subjectNodeByScopedId.get(scopedIdKey('u', 'sub-1'))?.posts).toHaveLength(1);
        expect(index.nodeByScopedPath.has('u:channel/root-channel/category/category/subject/subject')).toBe(true);
    });
});
