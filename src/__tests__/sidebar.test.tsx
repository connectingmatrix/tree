// @vitest-environment jsdom
import React, { useMemo, useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildTreeItems,
  normalizeTreeNodes,
  readTreeSelectionForModel,
  Tree,
} from "../index";
import { TreeNodeRecord } from "../types";

const createNode = (
  id: string,
  children: TreeNodeRecord[] = []
): TreeNodeRecord => ({
  id,
  kind: "folder",
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
const createRoots = (count = 1): TreeNodeRecord[] =>
  normalizeTreeNodes([
    createNode(
      "root",
      Array.from({ length: count }, (_item, index) =>
        createNode(`child-${index}`)
      )
    ),
  ]);

const TreeHarness = ({
  childCount = 1,
  filterQuery = "",
  onSelect,
}: {
  childCount?: number;
  filterQuery?: string;
  onSelect?: (label: string) => void;
}) => {
  const [expandedKeysByContext, setExpandedKeysByContext] = useState<
    Record<string, string[]>
  >({ user: ["group-u", "root"] });
  const [selectedByContext, setSelectedByContext] = useState<
    Record<string, ReturnType<typeof readTreeSelectionForModel> | undefined>
  >({});
  const items = useMemo(
    () =>
      buildTreeItems({
        filterQuery,
        maxVisibleChildren: 50,
        sections: [
          {
            id: "group-u",
            label: "User Tree",
            contextKey: "user",
            roots: createRoots(childCount),
            to: "/u",
          },
        ],
      }),
    [childCount, filterQuery]
  );
  return (
    <Tree
      activeContextKey="user"
      expandedKeysByContext={expandedKeysByContext}
      items={items}
      onSelect={(item) => {
        setSelectedByContext({ user: readTreeSelectionForModel("user", item) });
        if (onSelect) onSelect(item.label);
      }}
      selectedByContext={selectedByContext}
      toggleExpanded={(item) =>
        setExpandedKeysByContext((current) => ({
          ...current,
          [item.contextKey]: (current[item.contextKey] || []).includes(item.id)
            ? (current[item.contextKey] || []).filter(
                (entry) => entry !== item.id
              )
            : [...(current[item.contextKey] || []), item.id],
        }))
      }
    />
  );
};

describe("Tree", () => {
  afterEach(() => cleanup());

  it("selects a rendered node", async () => {
    const onSelect = vi.fn();
    render(<TreeHarness onSelect={onSelect} />);
    await waitFor(() => expect(screen.getByText("root")).toBeTruthy());
    fireEvent.click(screen.getByText("root"));
    expect(onSelect).toHaveBeenCalledWith("root");
  });

  it("renders range nodes after fifty children", async () => {
    render(<TreeHarness childCount={120} />);
    await waitFor(() => expect(screen.getByText("child-0")).toBeTruthy());
    expect(screen.getByText("[50-99]")).toBeTruthy();
    expect(screen.getByText("[100-119]")).toBeTruthy();
    expect(screen.queryByText("child-75")).toBeNull();
  });

  it("expands a range node into its slice only", async () => {
    render(<TreeHarness childCount={120} />);
    await waitFor(() => expect(screen.getByText("[50-99]")).toBeTruthy());
    fireEvent.click(screen.getByLabelText("Expand [50-99]"));
    await waitFor(() => expect(screen.getByText("child-75")).toBeTruthy());
    expect(screen.queryByText("child-110")).toBeNull();
  });
});
