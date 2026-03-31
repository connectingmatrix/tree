export type TreeScope = 'u' | 'g';
export type TreeContextType = 'user' | 'global' | 'organization';
export type TreeNodeType = 'channel' | 'category' | 'subject';

export interface TreePathSegment {
    type: TreeNodeType;
    slug: string;
    id: string;
    label: string;
}

export interface TreePostRecord {
    id: string;
    subject_id: string;
    title: string;
    narrative: string | null;
    metadata: Record<string, unknown>;
    created_at: string | null;
    updated_at: string | null;
}

export interface TreeNode {
    id: string;
    scope: TreeScope;
    nodeType: TreeNodeType;
    name: string;
    slug: string;
    description: string;
    url: string;
    parentId: string | null;
    depth: number;
    pathSegments: TreePathSegment[];
    children: TreeNode[];
    posts: TreePostRecord[];
}

export interface TreeIndex {
    rootsByScope: Record<TreeScope, TreeNode[]>;
    nodeByScopedId: Map<string, TreeNode>;
    nodeByScopedPath: Map<string, TreeNode>;
    subjectNodeByScopedId: Map<string, TreeNode>;
}

export interface TreeRouteResolution {
    scope: TreeScope;
    node: TreeNode | null;
    postId: string | null;
    post: TreePostRecord | null;
    pathSegments: TreePathSegment[];
    isRoot: boolean;
}

export interface RawTreeNode {
    id: string;
    nodeType: 'CHANNEL' | 'CATEGORY' | 'SUBJECT';
    name?: string | null;
    slug?: string | null;
    description?: string | null;
    posts?: TreePostRecord[];
    children?: RawTreeNode[];
}

export interface NormalizeTreeNodesInput {
    scope: TreeScope;
    rawNodes: RawTreeNode[];
}

export interface TreePatchCreateNodeOperation {
    kind: 'create-node';
    parentId: string | null;
    node: TreeNode;
}

export interface TreePatchDeleteNodeOperation {
    kind: 'delete-node';
    nodeId: string;
}

export interface TreePatchDeletePostOperation {
    kind: 'delete-post';
    subjectId: string;
    postId: string;
}

export interface TreePatchMoveNodeOperation {
    kind: 'move-node';
    nodeId: string;
    targetParentId: string | null;
}

export interface TreePatchLinkCategoryOperation {
    kind: 'link-category-to-channel';
    categoryId: string;
    channelId: string;
}

export interface TreePatchLinkSubjectOperation {
    kind: 'link-subject-to-category';
    subjectId: string;
    categoryId: string;
}

export type TreePatchOperation =
    | TreePatchCreateNodeOperation
    | TreePatchDeleteNodeOperation
    | TreePatchDeletePostOperation
    | TreePatchMoveNodeOperation
    | TreePatchLinkCategoryOperation
    | TreePatchLinkSubjectOperation;

export interface ReconcileTreeWithRetriesInput {
    fetchRoots: () => Promise<TreeNode[]>;
    matches: (roots: TreeNode[]) => boolean;
    maxAttempts?: number;
    baseDelayMs?: number;
    onAttempt?: (attempt: number) => void;
}

export interface ReconcileTreeWithRetriesResult {
    matched: boolean;
    attempts: number;
    roots: TreeNode[];
}

export interface TreeControllerState {
    rootsByContext: Record<string, TreeNode[]>;
    loadingByContext: Record<string, boolean>;
    loadingNodeIdsByContext: Record<string, Set<string>>;
    expandedKeyByContext: Record<string, string>;
}

export interface TreeController {
    getState: () => TreeControllerState;
    subscribe: (listener: (state: TreeControllerState) => void) => () => void;
    setRoots: (contextKey: string, roots: TreeNode[]) => void;
    applyPatch: (contextKey: string, operation: TreePatchOperation | TreePatchOperation[]) => void;
    setContextLoading: (contextKey: string, loading: boolean) => void;
    setNodeLoading: (contextKey: string, nodeIds: Array<string | null | undefined>, loading: boolean) => void;
    setExpandedKey: (contextKey: string, key: string) => void;
}

export interface StorageLike {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
}

export type TreeEventDetail = {
    type: 'channel_deleted' | 'category_deleted' | 'subject_created' | 'subject_deleted' | 'post_created' | 'post_deleted';
    channelId?: string;
    categoryId?: string;
    subjectId?: string;
    postId?: string;
};

export type TreeCreateRequestDetail = {
    mode: 'channel' | 'category' | 'subject' | 'post';
    nodeId?: string;
    nodeType?: 'channel' | 'category' | 'subject';
    scope?: TreeScope;
    organizationId?: string | null;
};

export interface TreeEventsApi {
    emitUpdate: (detail: TreeEventDetail) => void;
    subscribeToUpdates: (listener: (detail: TreeEventDetail) => void) => () => void;
    emitCreateRequest: (detail: TreeCreateRequestDetail) => void;
    subscribeToCreateRequests: (listener: (detail: TreeCreateRequestDetail) => void) => () => void;
}

export interface BuildTreeNodeModelOptions {
    treeContextType: TreeContextType;
    treeContextKey: string;
    organizationId?: string | null;
    loadingNodeIds?: Set<string>;
    canLazyLoadChildren?: (node: TreeNode) => boolean;
    resolveTreePath?: (path: string) => string;
    toChatUrl?: (node: TreeNode) => string;
    toPostChatUrl?: (node: TreeNode, post: TreePostRecord) => string;
}

export interface TreeNodeModel {
    id: string;
    label: string;
    nodeType: 'group' | 'channel' | 'category' | 'subject' | 'post';
    icon?: string;
    to?: string;
    url?: string;
    loading?: boolean;
    parentNodeId?: string;
    parentNodeType?: TreeNodeType;
    scope?: TreeScope;
    organizationId?: string | null;
    treeContextType?: TreeContextType;
    treeContextKey?: string;
    subjectId?: string;
    pathIds?: string[];
    canLazyLoadChildren?: boolean;
    items?: TreeNodeModel[];
}

export interface TreeSelection {
    id: string;
    nodeType: TreeNodeModel['nodeType'];
    treeContextKey: string;
    scope?: TreeScope;
    organizationId?: string | null;
    subjectId?: string;
    pathIds?: string[];
}

export interface TreeOrganizationRecord {
    id: string;
    name: string;
}

export type TreeRootKind = 'user-root' | 'organization-root' | 'global-root';

export interface TreeRootDefinition {
    kind: TreeRootKind;
    icon?: string;
    label?: string;
}

export interface TreeLoadState {
    loadedContextKeys: Record<string, boolean>;
    loadingContextKeys: Record<string, boolean>;
    errorByContext: Record<string, string>;
    organizations: TreeOrganizationRecord[];
    isOrganizationsLoading: boolean;
    organizationError: string | null;
}

export interface ReconcileContextInput {
    contextKey: string;
    matches: (roots: TreeNode[]) => boolean;
    maxAttempts?: number;
    baseDelayMs?: number;
}
