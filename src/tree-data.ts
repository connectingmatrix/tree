import { buildTreeNodeModels } from "./model";
import { TreeNodeModel, TreeNodeRecord, TreeSection } from "./types";

export interface BuildTreeItemsInput<T extends TreeNodeRecord> {
  filterQuery?: string;
  loadingNodeIdsByContext?: Record<string, Set<string>>;
  matchNode?: (node: T, query: string) => boolean;
  maxVisibleChildren?: number;
  readActionUrl?: (node: T, contextKey: string) => string | undefined;
  readNavigationUrl?: (node: T, contextKey: string) => string | undefined;
  canLazyLoadChildren?: (node: T) => boolean;
  readIcon?: (node: T) => string | undefined;
  sections: TreeSection<T>[];
}

const readSection = <T extends TreeNodeRecord>(
  section: TreeSection<T>,
  input: BuildTreeItemsInput<T>
): TreeNodeModel<T> | null => {
  const children = section.sections
    ? buildTreeItems({ ...input, sections: section.sections })
    : buildTreeNodeModels(section.roots || [], {
        contextKey: section.contextKey,
        filterQuery: input.filterQuery,
        loadingNodeIds: input.loadingNodeIdsByContext
          ? input.loadingNodeIdsByContext[section.contextKey] ||
            new Set<string>()
          : new Set<string>(),
        matchNode: input.matchNode,
        maxVisibleChildren: input.maxVisibleChildren,
        readActionUrl: input.readActionUrl,
        readNavigationUrl: input.readNavigationUrl,
        canLazyLoadChildren: input.canLazyLoadChildren,
        readIcon: input.readIcon,
      });
  if ((input.filterQuery || "").trim() && !children.length) return null;
  return {
    id: section.id,
    label: section.label,
    kind: "section",
    itemType: "section",
    icon: section.icon,
    to: section.to,
    checked: false,
    contextKey: section.contextKey,
    parentId: null,
    pathIds: [],
    properties: section.properties || {},
    state: {
      load: section.loading ? "loading" : "loading-done",
      expand: "collapsed",
    },
    contextState: { visible: true },
    editable: false,
    locked: false,
    visible: true,
    showCheckbox: false,
    canLazyLoadChildren: false,
    children,
    record: null,
  };
};

export const buildTreeItems = <T extends TreeNodeRecord>(
  input: BuildTreeItemsInput<T>
): TreeNodeModel<T>[] =>
  input.sections
    .map((section) => readSection(section, input))
    .filter(Boolean) as TreeNodeModel<T>[];
