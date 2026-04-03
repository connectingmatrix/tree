import {
  BuildTreeNodeModelOptions,
  TreeNodeModel,
  TreeNodeRecord,
} from "./types";

const matchesNode = <T extends TreeNodeRecord>(
  node: T,
  query: string,
  readMatch?: (node: T, query: string) => boolean
): boolean => {
  if (!query) return true;
  if (readMatch) return readMatch(node, query);
  return (
    `${node.label} ${JSON.stringify(node.properties || {})}`
      .toLowerCase()
      .indexOf(query) >= 0
  );
};

const readRangeItems = <T extends TreeNodeRecord>(
  items: TreeNodeModel<T>[],
  node: T,
  contextKey: string,
  maxVisibleChildren: number
): TreeNodeModel<T>[] => {
  if (items.length <= maxVisibleChildren) return items;
  const visible = items.slice(0, maxVisibleChildren);
  for (
    let start = maxVisibleChildren;
    start < items.length;
    start += maxVisibleChildren
  ) {
    const slice = items.slice(start, start + maxVisibleChildren);
    visible.push({
      id: `${node.id}__range__${start}`,
      label: `[${start}-${start + slice.length - 1}]`,
      kind: "range",
      itemType: "range",
      icon: "pi pi-fw pi-list",
      checked: false,
      contextKey,
      parentId: node.id,
      pathIds: node.pathIds,
      properties: { sourceId: node.id, start, end: start + slice.length - 1 },
      state: { load: "loading-done", expand: "collapsed" },
      contextState: { visible: true },
      editable: false,
      locked: true,
      visible: true,
      showCheckbox: false,
      canLazyLoadChildren: false,
      children: slice,
      record: null,
      rangeStart: start,
      rangeEnd: start + slice.length - 1,
    });
  }
  return visible;
};

export const buildTreeNodeModels = <T extends TreeNodeRecord>(
  nodes: T[],
  options: BuildTreeNodeModelOptions<T>
): TreeNodeModel<T>[] => {
  const query = (options.filterQuery || "").trim().toLowerCase();
  const maxVisibleChildren = options.maxVisibleChildren || 50;
  const loadingNodeIds = options.loadingNodeIds || new Set<string>();

  return nodes
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label))
    .reduce<TreeNodeModel<T>[]>((result, node) => {
      const children = buildTreeNodeModels(node.children as T[], options);
      const visibleChildren = readRangeItems(
        children,
        node,
        options.contextKey,
        maxVisibleChildren
      );
      if (
        !matchesNode(node, query, options.matchNode) &&
        !visibleChildren.length
      )
        return result;
      result.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        itemType: "node",
        icon: options.readIcon ? options.readIcon(node) : node.icon,
        to: options.readNavigationUrl
          ? options.readNavigationUrl(node, options.contextKey)
          : node.to,
        url: options.readActionUrl
          ? options.readActionUrl(node, options.contextKey)
          : node.url,
        loading: loadingNodeIds.has(node.id),
        checked: node.contextState.checked === true,
        contextKey: options.contextKey,
        parentId: node.parentId,
        pathIds: node.pathIds,
        properties: node.properties,
        state: {
          load: node.state.load,
          expand:
            visibleChildren.length > maxVisibleChildren
              ? "partial"
              : node.state.expand,
        },
        contextState: node.contextState,
        editable: node.editable,
        locked: node.locked,
        visible: node.visible,
        showCheckbox: node.showCheckbox,
        canLazyLoadChildren: options.canLazyLoadChildren
          ? options.canLazyLoadChildren(node)
          : false,
        children: visibleChildren,
        record: node,
      });
      return result;
    }, []);
};
