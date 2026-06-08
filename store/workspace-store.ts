import Fuse from "fuse.js";
import { create } from "zustand";
import { DEFAULT_SETTINGS, NOTE_COLORS } from "@/lib/constants";
import {
  deleteConnection as deletePersistedConnection,
  deleteNotes as deletePersistedNotes,
  deleteGroups as deletePersistedGroups,
  loadWorkspace,
  replaceWorkspace as replacePersistedWorkspace,
  saveConnection,
  saveGroups,
  saveNote,
  saveNotes,
  saveSettings
} from "@/lib/db";
import { createId } from "@/lib/id";
import { getStorageEstimate } from "@/lib/storage";
import { getTemplate } from "@/lib/templates";
import type {
  CanvasTool,
  Connection,
  ConnectionType,
  Note,
  NoteGroup,
  Point,
  Settings,
  StorageEstimateView,
  Viewport,
  Workspace
} from "@/lib/types";

export type SidebarPanel = "notes" | "tags" | "graph" | "export" | "settings";

interface WorkspaceState extends Workspace {
  activePanel: SidebarPanel;
  activeNoteId: string | null;
  canRedo: boolean;
  canUndo: boolean;
  commandPaletteOpen: boolean;
  connectSourceId: string | null;
  hasHydrated: boolean;
  isHydrating: boolean;
  searchQuery: string;
  selectedNoteIds: string[];
  storageEstimate: StorageEstimateView | null;
  tool: CanvasTool;
  viewport: Viewport;
  historyPast: Workspace[];
  historyFuture: Workspace[];
  exportState: "png" | "svg" | null;
  deleteConfirmIds: string[] | null;
  addConnection: (
    sourceId: string,
    targetId: string,
    type?: ConnectionType,
    label?: string
  ) => string | null;
  addGroup: (name: string, color: string) => string;
  applyTemplate: (templateId: string) => void;
  commitNotes: (ids: string[]) => void;
  createNote: (position?: Point) => string;
  deleteConnection: (id: string) => void;
  deleteSelectedNotes: () => void;
  deleteNotes: (ids: string[]) => void;
  getFilteredNotes: () => Note[];
  getWorkspace: () => Workspace;
  hydrate: () => Promise<void>;
  moveNotesBy: (ids: string[], delta: Point) => void;
  refreshStorageEstimate: () => Promise<void>;
  replaceWorkspace: (workspace: Workspace) => void;
  redo: () => void;
  selectNote: (id: string, mode?: "replace" | "toggle" | "add") => void;
  selectNotes: (ids: string[]) => void;
  setActivePanel: (panel: SidebarPanel) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setConnectSource: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTool: (tool: CanvasTool) => void;
  setViewport: (viewport: Viewport) => void;
  setExportState: (state: "png" | "svg" | null) => void;
  setDeleteConfirmIds: (ids: string[] | null) => void;
  undo: () => void;
  updateConnection: (id: string, patch: Partial<Connection>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  updateNoteTags: (id: string, tags: string[]) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const initialViewport: Viewport = { x: 420, y: 260, zoom: 1 };

function snapshot(
  state: Pick<WorkspaceState, "notes" | "connections" | "groups" | "settings">
) {
  return {
    notes: state.notes,
    connections: state.connections,
    groups: state.groups,
    settings: state.settings
  };
}

function roundToGrid(note: Note, gridSize: number): Note {
  return {
    ...note,
    x: Math.round(note.x / gridSize) * gridSize,
    y: Math.round(note.y / gridSize) * gridSize
  };
}

function cloneWorkspace(workspace: Workspace): Workspace {
  return {
    notes: workspace.notes.map((note) => ({ ...note, tags: [...note.tags] })),
    connections: workspace.connections.map((connection) => ({ ...connection })),
    groups: workspace.groups.map((group) => ({ ...group })),
    settings: { ...workspace.settings }
  };
}

function pushHistory(
  get: () => WorkspaceState,
  set: (patch: Partial<WorkspaceState> | ((state: WorkspaceState) => Partial<WorkspaceState>)) => void
) {
  const state = get();
  const nextPast = [...state.historyPast.slice(-39), cloneWorkspace(state.getWorkspace())];
  set({
    historyPast: nextPast,
    historyFuture: [],
    canUndo: true,
    canRedo: false
  });
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activePanel: "notes",
  activeNoteId: null,
  canRedo: false,
  canUndo: false,
  commandPaletteOpen: false,
  connectSourceId: null,
  connections: [],
  groups: [],
  hasHydrated: false,
  isHydrating: false,
  notes: [],
  searchQuery: "",
  selectedNoteIds: [],
  settings: DEFAULT_SETTINGS,
  storageEstimate: null,
  tool: "select",
  viewport: initialViewport,
  historyPast: [],
  historyFuture: [],
  exportState: null,
  deleteConfirmIds: null,

  async hydrate() {
    if (get().isHydrating || get().hasHydrated) return;
    set({ isHydrating: true });
    const workspace = await loadWorkspace();
    const state = get();
    set({
      ...workspace,
      activeNoteId: null,
      hasHydrated: true,
      isHydrating: false,
      selectedNoteIds: [],
      canUndo: state.historyPast.length > 0,
      canRedo: state.historyFuture.length > 0
    });
    await get().refreshStorageEstimate();
  },

  getWorkspace() {
    return snapshot(get());
  },

  replaceWorkspace(workspace) {
    pushHistory(get, set);
    set({
      ...workspace,
      activeNoteId: workspace.notes[0]?.id ?? null,
      selectedNoteIds: workspace.notes[0] ? [workspace.notes[0].id] : []
    });
    void replacePersistedWorkspace(workspace);
  },

  undo() {
    const { historyPast, historyFuture } = get();
    const previous = historyPast.at(-1);
    if (!previous) return;
    const nextPast = historyPast.slice(0, -1);
    const nextFuture = [...historyFuture, cloneWorkspace(get().getWorkspace())];
    set({
      ...cloneWorkspace(previous),
      activeNoteId: previous.notes[0]?.id ?? null,
      selectedNoteIds: previous.notes[0] ? [previous.notes[0].id] : [],
      historyPast: nextPast,
      historyFuture: nextFuture,
      canUndo: nextPast.length > 0,
      canRedo: true
    });
    void replacePersistedWorkspace(previous);
  },

  redo() {
    const { historyPast, historyFuture } = get();
    const next = historyFuture.at(-1);
    if (!next) return;
    const nextFuture = historyFuture.slice(0, -1);
    const nextPast = [...historyPast, cloneWorkspace(get().getWorkspace())];
    set({
      ...cloneWorkspace(next),
      activeNoteId: next.notes[0]?.id ?? null,
      selectedNoteIds: next.notes[0] ? [next.notes[0].id] : [],
      historyPast: nextPast,
      historyFuture: nextFuture,
      canUndo: true,
      canRedo: nextFuture.length > 0
    });
    void replacePersistedWorkspace(next);
  },

  createNote(position) {
    const state = get();
    pushHistory(get, set);
    const createdAt = Date.now();
    const note: Note = {
      id: createId("note"),
      title: "Untitled Note",
      content:
        "# Untitled Note\n\nWrite in Markdown, connect this note, or use the preview to read it.",
      x: position?.x ?? (-state.viewport.x + 520) / state.viewport.zoom,
      y: position?.y ?? (-state.viewport.y + 320) / state.viewport.zoom,
      color: NOTE_COLORS[state.notes.length % NOTE_COLORS.length],
      tags: [],
      createdAt,
      updatedAt: createdAt
    };

    set({
      notes: [...state.notes, note],
      activeNoteId: note.id,
      selectedNoteIds: [note.id]
    });
    void saveNote(note);
    return note.id;
  },

  updateNote(id, patch) {
    const updatedAt = Date.now();
    let nextNote: Note | undefined;
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id !== id) return note;
        nextNote = { ...note, ...patch, id, updatedAt };
        return nextNote;
      })
    }));
    if (nextNote) void saveNote(nextNote);
  },

  updateNoteTags(id, tags) {
    get().updateNote(id, { tags });
  },

  moveNotesBy(ids, delta) {
    if (ids.length === 0) return;
    const updatedAt = Date.now();
    set((state) => ({
      notes: state.notes.map((note) =>
        ids.includes(note.id)
          ? { ...note, x: note.x + delta.x, y: note.y + delta.y, updatedAt }
          : note
      )
    }));
  },

  commitNotes(ids) {
    const state = get();
    const notesToPersist = state.notes
      .filter((note) => ids.includes(note.id))
      .map((note) =>
        state.settings.snapToGrid ? roundToGrid(note, state.settings.gridSize) : note
      );

    if (state.settings.snapToGrid) {
      set((current) => ({
        notes: current.notes.map((note) => {
          const snapped = notesToPersist.find((item) => item.id === note.id);
          return snapped ?? note;
        })
      }));
    }

    if (notesToPersist.length > 0) void saveNotes(notesToPersist);
  },

  deleteNotes(ids) {
    if (ids.length === 0) return;
    pushHistory(get, set);

    set((state) => {
      const nextNotes = state.notes.filter((note) => !ids.includes(note.id));
      
      // Prune orphaned groups (BUG-010)
      const activeGroupIds = new Set(nextNotes.map((note) => note.groupId).filter(Boolean));
      const deadGroupIds: string[] = [];
      const nextGroups = state.groups.filter((group) => {
        const keep = activeGroupIds.has(group.id);
        if (!keep) deadGroupIds.push(group.id);
        return keep;
      });

      if (deadGroupIds.length > 0) {
        void deletePersistedGroups(deadGroupIds);
      }

      return {
        activeNoteId:
          state.activeNoteId && ids.includes(state.activeNoteId)
            ? null
            : state.activeNoteId,
        connectSourceId:
          state.connectSourceId && ids.includes(state.connectSourceId)
            ? null
            : state.connectSourceId,
        connections: state.connections.filter(
          (connection) =>
            !ids.includes(connection.sourceId) && !ids.includes(connection.targetId)
        ),
        notes: nextNotes,
        groups: nextGroups,
        selectedNoteIds: state.selectedNoteIds.filter((id) => !ids.includes(id))
      };
    });

    void deletePersistedNotes(ids);
  },

  deleteSelectedNotes() {
    const ids = get().selectedNoteIds;
    get().deleteNotes(ids);
  },

  selectNote(id, mode = "replace") {
    set((state) => {
      const selected = new Set(state.selectedNoteIds);
      if (mode === "replace") selected.clear();
      if (mode === "toggle" && selected.has(id)) selected.delete(id);
      else selected.add(id);

      return {
        activeNoteId: selected.has(id) ? id : (Array.from(selected)[0] ?? null),
        selectedNoteIds: Array.from(selected)
      };
    });
  },

  selectNotes(ids) {
    set({
      activeNoteId: ids[0] ?? null,
      selectedNoteIds: ids
    });
  },

  addConnection(sourceId, targetId, type = "related", label = "") {
    if (sourceId === targetId) return null;
    const state = get();
    const duplicate = state.connections.some(
      (connection) =>
        connection.sourceId === sourceId &&
        connection.targetId === targetId &&
        connection.type === type
    );
    if (duplicate) return null;
    pushHistory(get, set);

    const connection: Connection = {
      id: createId("connection"),
      sourceId,
      targetId,
      label,
      type
    };
    set({
      connections: [...state.connections, connection],
      connectSourceId: null,
      tool: "select"
    });
    void saveConnection(connection);
    return connection.id;
  },

  updateConnection(id, patch) {
    let nextConnection: Connection | undefined;
    set((state) => ({
      connections: state.connections.map((connection) => {
        if (connection.id !== id) return connection;
        nextConnection = { ...connection, ...patch, id };
        return nextConnection;
      })
    }));
    if (nextConnection) void saveConnection(nextConnection);
  },

  deleteConnection(id) {
    pushHistory(get, set);
    set((state) => ({
      connections: state.connections.filter((connection) => connection.id !== id)
    }));
    void deletePersistedConnection(id);
  },

  addGroup(name, color) {
    pushHistory(get, set);
    const group: NoteGroup = {
      id: createId("group"),
      name,
      color,
      createdAt: Date.now()
    };
    const groups = [...get().groups, group];
    set({ groups });
    void saveGroups(groups);
    return group.id;
  },

  applyTemplate(templateId) {
    const template = getTemplate(templateId);
    if (!template) return;
    pushHistory(get, set);

    const createdAt = Date.now();
    const noteIdMap = new Map<string, string>();
    const groupIdMap = new Map<string, string>();
    const offset = get().notes.length === 0 ? { x: 0, y: 0 } : { x: 820, y: 120 };

    const groups = template.workspace.groups.map((group) => {
      const id = createId("group");
      groupIdMap.set(group.id, id);
      return {
        ...group,
        id,
        createdAt
      };
    });

    const notes = template.workspace.notes.map((note) => {
      const id = createId("note");
      noteIdMap.set(note.id, id);
      return {
        ...note,
        id,
        x: note.x + offset.x,
        y: note.y + offset.y,
        groupId: note.groupId ? groupIdMap.get(note.groupId) : undefined,
        createdAt,
        updatedAt: createdAt
      };
    });

    const connections = template.workspace.connections
      .map((connection) => ({
        ...connection,
        id: createId("connection"),
        sourceId: noteIdMap.get(connection.sourceId) ?? "",
        targetId: noteIdMap.get(connection.targetId) ?? ""
      }))
      .filter((connection) => connection.sourceId && connection.targetId);

    set((state) => ({
      activeNoteId: notes[0]?.id ?? state.activeNoteId,
      connections: [...state.connections, ...connections],
      groups: [...state.groups, ...groups],
      notes: [...state.notes, ...notes],
      selectedNoteIds: notes[0] ? [notes[0].id] : state.selectedNoteIds
    }));

    void replacePersistedWorkspace(get().getWorkspace());
  },

  getFilteredNotes() {
    const state = get();
    const query = state.searchQuery.trim();
    if (!query) return state.notes;

    const fuse = new Fuse(state.notes, {
      keys: ["title", "content", "tags"],
      threshold: 0.32,
      ignoreLocation: true,
      minMatchCharLength: 2
    });

    return fuse.search(query).map((result) => result.item);
  },

  setSearchQuery(query) {
    set({ searchQuery: query });
  },

  setActivePanel(panel) {
    set({ activePanel: panel });
  },

  setTool(tool) {
    set({
      tool,
      connectSourceId: tool === "connect" ? get().connectSourceId : null
    });
  },

  setConnectSource(id) {
    set({
      connectSourceId: id,
      tool: id ? "connect" : get().tool
    });
  },

  setViewport(viewport) {
    set({ viewport });
  },

  setCommandPaletteOpen(open) {
    set({ commandPaletteOpen: open });
  },

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    void saveSettings(settings);
  },

  setExportState(state) {
    set({ exportState: state });
  },

  setDeleteConfirmIds(ids) {
    set({ deleteConfirmIds: ids });
  },

  async refreshStorageEstimate() {
    const estimate = await getStorageEstimate();
    set({ storageEstimate: estimate });
  }
}));

export function resetWorkspaceStoreForTests(workspace?: Workspace) {
  useWorkspaceStore.setState({
    activePanel: "notes",
    activeNoteId: workspace?.notes[0]?.id ?? null,
    canRedo: false,
    canUndo: false,
    commandPaletteOpen: false,
    connectSourceId: null,
    connections: workspace?.connections ?? [],
    groups: workspace?.groups ?? [],
    hasHydrated: true,
    isHydrating: false,
    notes: workspace?.notes ?? [],
    searchQuery: "",
    selectedNoteIds: workspace?.notes[0] ? [workspace.notes[0].id] : [],
    settings: workspace?.settings ?? DEFAULT_SETTINGS,
    storageEstimate: null,
    tool: "select",
    viewport: initialViewport,
    historyPast: [],
    historyFuture: [],
    exportState: null,
    deleteConfirmIds: null
  });
}
