import Dexie, { type Table } from "dexie";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { buildStarterWorkspace } from "@/lib/templates";
import type { Connection, Note, NoteGroup, Settings, Workspace } from "@/lib/types";

interface SettingsRecord {
  id: "settings";
  value: Settings;
}

class InfiniteCanvasDatabase extends Dexie {
  notes!: Table<Note, string>;
  connections!: Table<Connection, string>;
  groups!: Table<NoteGroup, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super("InfiniteCanvasNotes");
    this.version(1).stores({
      notes: "id, title, *tags, updatedAt, groupId",
      connections: "id, sourceId, targetId, type",
      groups: "id, name",
      settings: "id"
    });
  }
}

const memoryWorkspace: Workspace = buildStarterWorkspace();

export const db = new InfiniteCanvasDatabase();

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

async function seedIfNeeded(): Promise<void> {
  const count = await db.notes.count();
  if (count > 0) return;

  const starter = buildStarterWorkspace();
  await db.transaction(
    "rw",
    db.notes,
    db.connections,
    db.groups,
    db.settings,
    async () => {
      await db.notes.bulkPut(starter.notes);
      await db.connections.bulkPut(starter.connections);
      await db.groups.bulkPut(starter.groups);
      await db.settings.put({ id: "settings", value: starter.settings });
    }
  );
}

export async function loadWorkspace(): Promise<Workspace> {
  if (!hasIndexedDb()) {
    return structuredClone(memoryWorkspace);
  }

  try {
    await seedIfNeeded();
    const [notes, connections, groups, settingsRecord] = await Promise.all([
      db.notes.toArray(),
      db.connections.toArray(),
      db.groups.toArray(),
      db.settings.get("settings")
    ]);

    return {
      notes,
      connections,
      groups,
      settings: settingsRecord?.value ?? DEFAULT_SETTINGS
    };
  } catch {
    return structuredClone(memoryWorkspace);
  }
}

export async function replaceWorkspace(workspace: Workspace): Promise<void> {
  memoryWorkspace.notes = workspace.notes;
  memoryWorkspace.connections = workspace.connections;
  memoryWorkspace.groups = workspace.groups;
  memoryWorkspace.settings = workspace.settings;

  if (!hasIndexedDb()) return;

  await db.transaction(
    "rw",
    db.notes,
    db.connections,
    db.groups,
    db.settings,
    async () => {
      await db.notes.clear();
      await db.connections.clear();
      await db.groups.clear();
      await db.notes.bulkPut(workspace.notes);
      await db.connections.bulkPut(workspace.connections);
      await db.groups.bulkPut(workspace.groups);
      await db.settings.put({ id: "settings", value: workspace.settings });
    }
  );
}

export async function saveNote(note: Note): Promise<void> {
  const index = memoryWorkspace.notes.findIndex((item) => item.id === note.id);
  if (index >= 0) memoryWorkspace.notes[index] = note;
  else memoryWorkspace.notes.push(note);
  if (hasIndexedDb()) await db.notes.put(note);
}

export async function saveNotes(notes: Note[]): Promise<void> {
  for (const note of notes) {
    const index = memoryWorkspace.notes.findIndex((item) => item.id === note.id);
    if (index >= 0) memoryWorkspace.notes[index] = note;
    else memoryWorkspace.notes.push(note);
  }
  if (hasIndexedDb()) await db.notes.bulkPut(notes);
}

export async function deleteNotes(ids: string[]): Promise<void> {
  memoryWorkspace.notes = memoryWorkspace.notes.filter((note) => !ids.includes(note.id));
  memoryWorkspace.connections = memoryWorkspace.connections.filter(
    (connection) =>
      !ids.includes(connection.sourceId) && !ids.includes(connection.targetId)
  );

  if (!hasIndexedDb()) return;
  await db.transaction("rw", db.notes, db.connections, async () => {
    await db.notes.bulkDelete(ids);
    const deadConnections = await db.connections
      .filter(
        (connection) =>
          ids.includes(connection.sourceId) || ids.includes(connection.targetId)
      )
      .primaryKeys();
    await db.connections.bulkDelete(deadConnections as string[]);
  });
}

export async function saveConnection(connection: Connection): Promise<void> {
  const index = memoryWorkspace.connections.findIndex(
    (item) => item.id === connection.id
  );
  if (index >= 0) memoryWorkspace.connections[index] = connection;
  else memoryWorkspace.connections.push(connection);
  if (hasIndexedDb()) await db.connections.put(connection);
}

export async function deleteConnection(id: string): Promise<void> {
  memoryWorkspace.connections = memoryWorkspace.connections.filter(
    (connection) => connection.id !== id
  );
  if (hasIndexedDb()) await db.connections.delete(id);
}

export async function saveGroups(groups: NoteGroup[]): Promise<void> {
  memoryWorkspace.groups = groups;
  if (hasIndexedDb()) await db.groups.bulkPut(groups);
}

export async function deleteGroups(ids: string[]): Promise<void> {
  memoryWorkspace.groups = memoryWorkspace.groups.filter((group) => !ids.includes(group.id));
  if (hasIndexedDb()) await db.groups.bulkDelete(ids);
}

export async function saveSettings(settings: Settings): Promise<void> {
  memoryWorkspace.settings = settings;
  if (hasIndexedDb()) await db.settings.put({ id: "settings", value: settings });
}
