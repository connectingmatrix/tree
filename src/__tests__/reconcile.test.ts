import { describe, expect, it } from "vitest";
import { reconcileTreeWithRetries } from "../reconcile";
import { TreeNodeRecord } from "../types";

const createRoot = (id: string): TreeNodeRecord => ({
  id,
  kind: "folder",
  label: id,
  parentId: null,
  depth: 0,
  pathIds: [id],
  children: [],
  childCount: 0,
  properties: { id },
  state: { load: "loading-done", expand: "expanded" },
  contextState: { visible: true },
  editable: true,
  locked: false,
  visible: true,
  showCheckbox: false,
});

describe("reconcileTreeWithRetries", () => {
  it("retries until a matching root is returned", async () => {
    let count = 0;
    const result = await reconcileTreeWithRetries({
      fetchRoots: async () => {
        count += 1;
        return count < 3 ? [createRoot("a")] : [createRoot("b")];
      },
      matches: (roots) => roots[0]?.id === "b",
      maxAttempts: 4,
      baseDelayMs: 1,
    });
    expect(result.matched).toBe(true);
    expect(result.attempts).toBe(3);
    expect(result.roots[0]?.id).toBe("b");
  });
});
