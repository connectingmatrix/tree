import { describe, expect, it } from "vitest";
import {
  buildTreeIndex,
  normalizeTreeNodes,
  readTreeNodeKey,
} from "../normalize";
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
  pathIds: [],
  children,
  childCount: children.length,
  properties: { id },
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

describe("normalizeTreeNodes + buildTreeIndex", () => {
  it("normalizes nested nodes and indexes them by context", () => {
    const roots = normalizeTreeNodes([
      createNode("root", "folder", [createNode("child", "leaf")]),
    ]);
    const index = buildTreeIndex({ user: roots });
    expect(roots[0]?.pathIds).toEqual(["root"]);
    expect(roots[0]?.children[0]?.pathIds).toEqual(["root", "child"]);
    expect(
      index.nodeByContextId.get(readTreeNodeKey("user", "child"))?.label
    ).toBe("child");
  });
});
