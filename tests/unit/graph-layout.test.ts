import { describe, expect, it } from "vitest";
import { computeForceLayout } from "@/lib/graph/layout";
import { buildStarterWorkspace } from "@/lib/templates";

describe("graph layout", () => {
  it("returns stable coordinates for each note", () => {
    const workspace = buildStarterWorkspace();
    const layout = computeForceLayout(workspace.notes, workspace.connections);

    expect(layout).toHaveLength(workspace.notes.length);
    for (const node of layout) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.cluster.length).toBeGreaterThan(0);
    }
  });
});
