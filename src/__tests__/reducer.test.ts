import { describe, expect, it } from 'vitest';
import { applyTreePatchOperations, hasNodeInTree, hasPostInTree } from '../reducer';
import { TreeNode } from '../types';

const baseTree: TreeNode[] = [
    {
        id: 'channel-1',
        scope: 'u',
        nodeType: 'channel',
        name: 'Channel 1',
        slug: 'channel-1',
        description: '',
        url: '/u/channel/channel-1',
        parentId: null,
        depth: 0,
        pathSegments: [{ type: 'channel', slug: 'channel-1', id: 'channel-1', label: 'Channel 1' }],
        posts: [],
        children: [
            {
                id: 'category-1',
                scope: 'u',
                nodeType: 'category',
                name: 'Category 1',
                slug: 'category-1',
                description: '',
                url: '/u/channel/channel-1/category/category-1',
                parentId: 'channel-1',
                depth: 1,
                pathSegments: [
                    { type: 'channel', slug: 'channel-1', id: 'channel-1', label: 'Channel 1' },
                    { type: 'category', slug: 'category-1', id: 'category-1', label: 'Category 1' }
                ],
                posts: [],
                children: [
                    {
                        id: 'subject-1',
                        scope: 'u',
                        nodeType: 'subject',
                        name: 'Subject 1',
                        slug: 'subject-1',
                        description: '',
                        url: '/u/channel/channel-1/category/category-1/subject/subject-1',
                        parentId: 'category-1',
                        depth: 2,
                        pathSegments: [
                            { type: 'channel', slug: 'channel-1', id: 'channel-1', label: 'Channel 1' },
                            { type: 'category', slug: 'category-1', id: 'category-1', label: 'Category 1' },
                            { type: 'subject', slug: 'subject-1', id: 'subject-1', label: 'Subject 1' }
                        ],
                        posts: [
                            {
                                id: 'post-1',
                                subject_id: 'subject-1',
                                title: 'Post 1',
                                narrative: null,
                                metadata: {},
                                created_at: null,
                                updated_at: null
                            }
                        ],
                        children: []
                    }
                ]
            }
        ]
    },
    {
        id: 'channel-2',
        scope: 'u',
        nodeType: 'channel',
        name: 'Channel 2',
        slug: 'channel-2',
        description: '',
        url: '/u/channel/channel-2',
        parentId: null,
        depth: 0,
        pathSegments: [{ type: 'channel', slug: 'channel-2', id: 'channel-2', label: 'Channel 2' }],
        posts: [],
        children: []
    }
];

describe('applyTreePatchOperations', () => {
    it('supports create/delete/move/link patch operations', () => {
        const createdNode: TreeNode = {
            id: 'subject-2',
            scope: 'u',
            nodeType: 'subject',
            name: 'Subject 2',
            slug: 'subject-2',
            description: '',
            url: '/u/channel/channel-1/category/category-1/subject/subject-2',
            parentId: 'category-1',
            depth: 2,
            pathSegments: [
                { type: 'channel', slug: 'channel-1', id: 'channel-1', label: 'Channel 1' },
                { type: 'category', slug: 'category-1', id: 'category-1', label: 'Category 1' },
                { type: 'subject', slug: 'subject-2', id: 'subject-2', label: 'Subject 2' }
            ],
            posts: [],
            children: []
        };

        const patched = applyTreePatchOperations(baseTree, [
            { kind: 'create-node', parentId: 'category-1', node: createdNode },
            { kind: 'delete-post', subjectId: 'subject-1', postId: 'post-1' },
            { kind: 'link-subject-to-category', subjectId: 'subject-2', categoryId: 'category-1' },
            { kind: 'link-category-to-channel', categoryId: 'category-1', channelId: 'channel-2' },
            { kind: 'delete-node', nodeId: 'subject-1' }
        ]);

        expect(hasNodeInTree(patched, 'subject-2')).toBe(true);
        expect(hasNodeInTree(patched, 'subject-1')).toBe(false);
        expect(hasPostInTree(patched, 'subject-1', 'post-1')).toBe(false);

        const linkedChannel = patched.find((node) => node.id === 'channel-2');
        expect(linkedChannel?.children.some((child) => child.id === 'category-1')).toBe(true);
    });
});
