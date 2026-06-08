import { describe, expect, it } from "vitest";
import { buildMarkdownArchiveEntries, serializeWorkspace } from "@/lib/export/exporter";
import { buildStarterWorkspace } from "@/lib/templates";

describe("workspace exporter", () => {
  it("serializes a complete JSON graph", () => {
    const workspace = buildStarterWorkspace();
    const parsed = JSON.parse(serializeWorkspace(workspace));

    expect(parsed.app).toBe("Infinite Canvas Notes");
    expect(parsed.workspace.notes.length).toBeGreaterThan(0);
    expect(parsed.workspace.connections.length).toBeGreaterThan(0);
  });

  it("creates markdown files and a connection index", () => {
    const workspace = buildStarterWorkspace();
    const entries = buildMarkdownArchiveEntries(workspace);

    expect(entries.some((entry) => entry.path === "connections.md")).toBe(true);
    expect(entries.some((entry) => entry.path === "workspace.json")).toBe(true);
    expect(entries.filter((entry) => entry.path.startsWith("notes/"))).toHaveLength(
      workspace.notes.length
    );
    expect(entries[0]?.content).toContain("---");
  });
});
