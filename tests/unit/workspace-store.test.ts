import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Workspace } from "@/lib/types";
import { resetWorkspaceStoreForTests, useWorkspaceStore } from "@/store/workspace-store";

vi.mock("@/lib/db", () => ({
  deleteConnection: vi.fn(async () => undefined),
  deleteNotes: vi.fn(async () => undefined),
  loadWorkspace: vi.fn(async () => ({
    notes: [],
    connections: [],
    groups: [],
    settings: DEFAULT_SETTINGS
  })),
  replaceWorkspace: vi.fn(async () => undefined),
  saveConnection: vi.fn(async () => undefined),
  saveGroups: vi.fn(async () => undefined),
  saveNote: vi.fn(async () => undefined),
  saveNotes: vi.fn(async () => undefined),
  saveSettings: vi.fn(async () => undefined)
}));

const workspace: Workspace = {
  notes: [
    {
      id: "note_a",
      title: "Alpha",
      content: "A note about durable systems",
      x: 0,
      y: 0,
      color: "#bfdbfe",
      tags: ["systems"],
      createdAt: 1,
      updatedAt: 1
    },
    {
      id: "note_b",
      title: "Beta",
      content: "A note about research",
      x: 360,
      y: 0,
      color: "#d9f99d",
      tags: ["research"],
      createdAt: 1,
      updatedAt: 1
    }
  ],
  connections: [],
  groups: [],
  settings: DEFAULT_SETTINGS
};

describe("workspace store", () => {
  beforeEach(() => {
    resetWorkspaceStoreForTests(workspace);
  });

  it("creates notes with persisted state", () => {
    const id = useWorkspaceStore.getState().createNote({ x: 12, y: 24 });
    const state = useWorkspaceStore.getState();

    expect(state.notes.some((note) => note.id === id)).toBe(true);
    expect(state.activeNoteId).toBe(id);
    expect(state.selectedNoteIds).toEqual([id]);
  });

  it("updates note content and fuzzy filters results", () => {
    useWorkspaceStore.getState().updateNote("note_a", { content: "quantum apple" });
    useWorkspaceStore.getState().setSearchQuery("quant apple");

    expect(
      useWorkspaceStore
        .getState()
        .getFilteredNotes()
        .map((note) => note.id)
    ).toContain("note_a");
  });

  it("adds and removes connections", () => {
    const id = useWorkspaceStore
      .getState()
      .addConnection("note_a", "note_b", "supports", "backs");
    expect(id).toBeTruthy();
    expect(useWorkspaceStore.getState().connections).toHaveLength(1);

    useWorkspaceStore.getState().deleteConnection(id as string);
    expect(useWorkspaceStore.getState().connections).toHaveLength(0);
  });

  it("deletes selected notes and related connections", () => {
    useWorkspaceStore.getState().addConnection("note_a", "note_b");
    useWorkspaceStore.getState().selectNote("note_a");
    useWorkspaceStore.getState().deleteSelectedNotes();

    expect(useWorkspaceStore.getState().notes.map((note) => note.id)).toEqual(["note_b"]);
    expect(useWorkspaceStore.getState().connections).toHaveLength(0);
  });
});
