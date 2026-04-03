import { describe, expect, it } from "vitest";
import {
  applyTreePatchOperations,
  findTreeChild,
  findTreeParent,
  hasNodeInTree,
} from "../reducer";
import { TreeNodeRecord } from "../types";

const createNode = (
  id: string,
  kind: string,
  children: TreeNodeRecord[] = []
): TreeNodeRecord => ({
  id,
  kind,
  label: id,
  parentId: null,
  depth: 0,
  pathIds: [id],
  children,
  childCount: children.length,
  properties: { id, kind },
  state: {
    load: "loading-done",
    expand: children.length ? "collapsed" : "expanded",
  },
  contextState: { visible: true },
  editable: true,
  locked: false,
  visible: true,
  showCheckbox: false,
});

describe("applyTreePatchOperations", () => {
  it("supports insert, move, update, and remove operations", () => {
    const roots = [
      createNode("root", "folder", [createNode("child", "leaf")]),
      createNode("other", "folder"),
    ];
    const inserted = createNode("new", "leaf");
    const patched = applyTreePatchOperations(roots, [
      { kind: "insert-node", parentId: "root", node: inserted },
      { kind: "move-node", nodeId: "new", parentId: "other" },
      { kind: "update-node", nodeId: "other", changes: { label: "Other" } },
      { kind: "remove-node", nodeId: "child" },
    ]);
    expect(hasNodeInTree(patched, "child")).toBe(false);
    expect(findTreeChild(patched, "other", "new")?.id).toBe("new");
    expect(findTreeParent(patched, "new", "other")?.label).toBe("Other");
  });
});
