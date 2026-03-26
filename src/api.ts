import { RawTreeNode, TreeNode, TreeScope } from './types';

export interface TreeFetchInput {
    scope: TreeScope;
    userPermissionsId: string;
    organizationId?: string | null;
    includeGlobal?: boolean;
}

export interface TreeFetchResult {
    user: RawTreeNode[];
    global: RawTreeNode[];
}

export interface CreateChannelInput {
    scope: TreeScope;
    organizationId?: string | null;
    name: string;
    slug: string;
    description?: string | null;
    parentChannelId?: string;
    ownerUserPermissionsId?: string;
}

export interface CreateCategoryInput {
    scope: TreeScope;
    organizationId?: string | null;
    name: string;
    slug: string;
    description?: string | null;
    parentChannelId?: string;
    parentCategoryId?: string;
    ownerUserPermissionsId?: string;
}

export interface CreateSubjectInput {
    scope: TreeScope;
    organizationId?: string | null;
    name: string;
    description?: string;
    categoryId: string;
}

export interface DeleteNodeInput {
    id: string;
    scope: TreeScope;
    organizationId?: string | null;
}

export interface DeletePostInput {
    id: string;
    subjectId?: string;
    scope: TreeScope;
    organizationId?: string | null;
}

export interface MoveChannelInput {
    channelId: string;
    newParentChannelId: string;
    scope: TreeScope;
    organizationId?: string | null;
}

export interface LinkCategoryToChannelsInput {
    categoryId: string;
    channelIds: string[];
    scope: TreeScope;
    organizationId?: string | null;
}

export interface LinkSubjectToCategoryInput {
    subjectId: string;
    categoryId: string;
    scope: TreeScope;
    organizationId?: string | null;
}

export interface TreeApiAdapter {
    fetchTree: (input: TreeFetchInput) => Promise<TreeFetchResult>;
    listOrganizations: () => Promise<Array<{ id: string; name: string }>>;
    createChannel: (input: CreateChannelInput) => Promise<{ node: Partial<TreeNode> & { id: string } }>;
    createCategory: (input: CreateCategoryInput) => Promise<{ node: Partial<TreeNode> & { id: string } }>;
    createSubject: (input: CreateSubjectInput) => Promise<{ node: Partial<TreeNode> & { id: string } }>;
    deleteChannel: (input: DeleteNodeInput) => Promise<void>;
    deleteCategory: (input: DeleteNodeInput) => Promise<void>;
    deleteSubject: (input: DeleteNodeInput) => Promise<void>;
    deletePost: (input: DeletePostInput) => Promise<void>;
    moveChannel: (input: MoveChannelInput) => Promise<void>;
    linkCategoryToChannels: (input: LinkCategoryToChannelsInput) => Promise<void>;
    linkSubjectToCategory: (input: LinkSubjectToCategoryInput) => Promise<void>;
}
