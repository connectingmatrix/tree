// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createTreeRenderState,
  readTreeRenderState,
} from "../render-persistence";
import { StorageLike } from "../types";

const createMemoryStorage = (seed?: string): StorageLike => {
  let value = seed || null;
  return {
    getItem: () => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
  };
};

describe("render persistence", () => {
  it("falls back to default render state", () => {
    expect(readTreeRenderState(createMemoryStorage("{broken-json"))).toEqual(
      createTreeRenderState()
    );
  });

  it("reads stored active context and selected node", () => {
    const state = readTreeRenderState(
      createMemoryStorage(
        JSON.stringify({
          activeContextKey: "teams",
          expandedKeysByContext: { teams: ["group-teams"] },
          selectedByContext: {
            teams: {
              contextKey: "teams",
              id: "node-1",
              kind: "folder",
              itemType: "node",
              parentId: null,
              pathIds: ["node-1"],
              properties: {},
            },
          },
        })
      )
    );

    expect(state.activeContextKey).toBe("teams");
    expect(state.selectedByContext.teams?.id).toBe("node-1");
  });
});
