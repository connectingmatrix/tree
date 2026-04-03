export type TreeKind = string;
export type TreeItemType = "section" | "node" | "range";
export type TreeMatch<T> = string | ((node: T) => boolean);

export interface TreeNodeState {
  load: "idle" | "loading" | "loading-done";
  expand: "collapsed" | "expanded" | "partial";
}

export interface TreeNodeContextState {
  checked?: boolean;
  editing?: boolean;
  locked?: boolean;
  selected?: boolean;
  visible?: boolean;
  [key: string]: unknown;
}

export interface TreeNodeRecord {
  id: string;
  kind: TreeKind;
  label: string;
  parentId: string | null;
  depth: number;
  pathIds: string[];
  children: TreeNodeRecord[];
  childCount: number;
  properties: Record<string, unknown>;
  state: TreeNodeState;
  contextState: TreeNodeContextState;
  editable: boolean;
  locked: boolean;
  visible: boolean;
  showCheckbox: boolean;
  icon?: string;
  to?: string;
  url?: string;
}

export interface TreeSelection {
  contextKey: string;
  id: string;
  kind: TreeKind;
  itemType: TreeItemType;
  parentId: string | null;
  pathIds: string[];
  properties: Record<string, unknown>;
}

export interface TreeIndex<T extends TreeNodeRecord = TreeNodeRecord> {
  rootsByContext: Record<string, T[]>;
  nodeByContextId: Map<string, T>;
  nodeById: Map<string, T>;
  childrenByParentId: Map<string, T[]>;
}

export interface TreeSection<T extends TreeNodeRecord = TreeNodeRecord> {
  id: string;
  contextKey: string;
  label: string;
  icon?: string;
  loading?: boolean;
  properties?: Record<string, unknown>;
  roots?: T[];
  sections?: TreeSection<T>[];
  to?: string;
}

export interface TreeNodeModel<T extends TreeNodeRecord = TreeNodeRecord> {
  id: string;
  label: string;
  kind: TreeKind;
  itemType: TreeItemType;
  icon?: string;
  to?: string;
  url?: string;
  loading?: boolean;
  checked: boolean;
  contextKey: string;
  parentId: string | null;
  pathIds: string[];
  properties: Record<string, unknown>;
  state: TreeNodeState;
  contextState: TreeNodeContextState;
  editable: boolean;
  locked: boolean;
  visible: boolean;
  showCheckbox: boolean;
  canLazyLoadChildren: boolean;
  children: TreeNodeModel<T>[];
  record: T | null;
  rangeStart?: number;
  rangeEnd?: number;
}

export interface BuildTreeNodeModelOptions<T extends TreeNodeRecord> {
  contextKey: string;
  filterQuery?: string;
  loadingNodeIds?: Set<string>;
  matchNode?: (node: T, query: string) => boolean;
  maxVisibleChildren?: number;
  readActionUrl?: (node: T, contextKey: string) => string | undefined;
  readNavigationUrl?: (node: T, contextKey: string) => string | undefined;
  canLazyLoadChildren?: (node: T) => boolean;
  readIcon?: (node: T) => string | undefined;
}

export interface TreeInsertNodeChange<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  kind: "insert-node";
  parentId: string | null;
  node: T;
}

export interface TreeRemoveNodeChange {
  kind: "remove-node";
  nodeId: string;
}

export interface TreeMoveNodeChange {
  kind: "move-node";
  nodeId: string;
  parentId: string | null;
}

export interface TreeReplaceNodeChange<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  kind: "replace-node";
  nodeId: string;
  node: T;
}

export interface TreeSetChildrenChange<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  kind: "set-children";
  nodeId: string;
  children: T[];
}

export interface TreeUpdateNodeChange<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  kind: "update-node";
  nodeId: string;
  changes: Partial<T>;
}

export type TreeChange<T extends TreeNodeRecord = TreeNodeRecord> =
  | TreeInsertNodeChange<T>
  | TreeMoveNodeChange
  | TreeRemoveNodeChange
  | TreeReplaceNodeChange<T>
  | TreeSetChildrenChange<T>
  | TreeUpdateNodeChange<T>;

export interface TreeControllerState<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  rootsByContext: Record<string, T[]>;
  expandedKeysByContext: Record<string, string[]>;
  selectedByContext: Record<string, TreeSelection | undefined>;
  filterByContext: Record<string, string>;
  loadingContextKeys: Record<string, boolean>;
  loadingNodeIdsByContext: Record<string, Set<string>>;
}

export interface TreeController<T extends TreeNodeRecord = TreeNodeRecord> {
  getState: () => TreeControllerState<T>;
  subscribe: (listener: (state: TreeControllerState<T>) => void) => () => void;
  setRoots: (contextKey: string, roots: T[]) => void;
  applyChanges: (
    contextKey: string,
    changes: TreeChange<T> | TreeChange<T>[]
  ) => void;
  setContextLoading: (contextKey: string, loading: boolean) => void;
  setNodeLoading: (
    contextKey: string,
    nodeIds: string[],
    loading: boolean
  ) => void;
  setSelected: (contextKey: string, selection: TreeSelection | null) => void;
  expand: (contextKey: string, nodeId: string) => void;
  collapse: (contextKey: string, nodeId: string) => void;
  setFilter: (contextKey: string, value: string) => void;
  getParent: (contextKey: string, nodeId: string) => T | null;
  getChildren: (contextKey: string, nodeId: string | null) => T[];
  findParent: (
    contextKey: string,
    nodeId: string,
    match: TreeMatch<T>
  ) => T | null;
  findChild: (
    contextKey: string,
    nodeId: string | null,
    match: TreeMatch<T>
  ) => T | null;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface TreeDataSource<T extends TreeNodeRecord = TreeNodeRecord> {
  loadRoots: (contextKey: string) => Promise<T[]>;
  loadChildren?: (node: T, contextKey: string) => Promise<T[]>;
  loadSubTree?: (node: T, contextKey: string) => Promise<T>;
}

export interface TreeLoadState {
  loadedContextKeys: Record<string, boolean>;
  loadingContextKeys: Record<string, boolean>;
  errorByContext: Record<string, string>;
}

export interface ReconcileContextInput<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  contextKey: string;
  matches: (roots: T[]) => boolean;
  maxAttempts?: number;
  baseDelayMs?: number;
}

export interface ReconcileTreeWithRetriesInput<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  fetchRoots: () => Promise<T[]>;
  matches: (roots: T[]) => boolean;
  maxAttempts?: number;
  baseDelayMs?: number;
  onAttempt?: (attempt: number) => void;
}

export interface ReconcileTreeWithRetriesResult<
  T extends TreeNodeRecord = TreeNodeRecord
> {
  matched: boolean;
  attempts: number;
  roots: T[];
}
