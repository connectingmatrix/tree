import { TreeNodeModel, TreeNodeRecord, TreeSelection } from "./types";

export const readTreeSelectionForModel = <T extends TreeNodeRecord>(
  contextKey: string,
  item: TreeNodeModel<T>
): TreeSelection => ({
  contextKey,
  id: item.id,
  kind: item.kind,
  itemType: item.itemType,
  parentId: item.parentId,
  pathIds: item.pathIds,
  properties: item.properties,
});

export const readTreeSelectionForNode = <T extends TreeNodeRecord>(
  contextKey: string,
  node: T
): TreeSelection => ({
  contextKey,
  id: node.id,
  kind: node.kind,
  itemType: "node",
  parentId: node.parentId,
  pathIds: node.pathIds,
  properties: node.properties,
});
