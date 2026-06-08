"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent
} from "react";
import { motion } from "framer-motion";
import { Cable, FolderPlus, Trash2, X } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { IconButton } from "@/components/ui/icon-button";
import { TextButton } from "@/components/ui/text-button";
import { CONNECTION_STYLES, NOTE_COLORS } from "@/lib/constants";
import type { ConnectionType } from "@/lib/types";
import { clamp, cn, splitTags } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

const DEFAULT_EDITOR_WIDTH = 420;
const MIN_EDITOR_WIDTH = 320;
const MAX_EDITOR_WIDTH = 700;
const EDITOR_WIDTH_KEY = "infinite-canvas-notes:editor-width";

export function NoteInspector() {
  const activeNoteId = useWorkspaceStore((state) => state.activeNoteId);
  const notes = useWorkspaceStore((state) => state.notes);
  const connections = useWorkspaceStore((state) => state.connections);
  const groups = useWorkspaceStore((state) => state.groups);
  const addConnection = useWorkspaceStore((state) => state.addConnection);
  const addGroup = useWorkspaceStore((state) => state.addGroup);
  const deleteConnection = useWorkspaceStore((state) => state.deleteConnection);
  const updateConnection = useWorkspaceStore((state) => state.updateConnection);
  const updateNote = useWorkspaceStore((state) => state.updateNote);
  const selectNotes = useWorkspaceStore((state) => state.selectNotes);

  const activeNote = notes.find((note) => note.id === activeNoteId);
  const [targetId, setTargetId] = useState("");
  const [connectionType, setConnectionType] = useState<ConnectionType>("related");
  const [connectionLabel, setConnectionLabel] = useState("");
  const [groupName, setGroupName] = useState("");
  const [width, setWidth] = useState(DEFAULT_EDITOR_WIDTH);

  useEffect(() => {
    const stored = window.localStorage.getItem(EDITOR_WIDTH_KEY);
    if (!stored) return;
    setWidth(clamp(Number(stored), MIN_EDITOR_WIDTH, MAX_EDITOR_WIDTH));
  }, []);

  useEffect(() => {
    setTargetId("");
    setConnectionLabel("");
  }, [activeNoteId]);

  const connected = useMemo(
    () =>
      activeNote
        ? connections.filter(
            (connection) =>
              connection.sourceId === activeNote.id ||
              connection.targetId === activeNote.id
          )
        : [],
    [activeNote, connections]
  );

  const beginResize = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const nextWidth = clamp(
        startWidth + startX - moveEvent.clientX,
        MIN_EDITOR_WIDTH,
        MAX_EDITOR_WIDTH
      );
      setWidth(nextWidth);
      window.localStorage.setItem(EDITOR_WIDTH_KEY, String(nextWidth));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (!activeNote) return null;

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel absolute bottom-3 right-3 top-20 z-40 flex w-[calc(100vw-1.5rem)] max-w-[var(--editor-width)] flex-col overflow-hidden rounded-xl md:bottom-4 md:right-4 md:top-20"
      data-testid="note-inspector"
      exit={{ opacity: 0, x: 44 }}
      initial={{ opacity: 0, x: 44 }}
      style={{ "--editor-width": `${width}px` } as CSSProperties}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div
        aria-hidden
        className="absolute bottom-0 left-0 top-0 hidden w-2 cursor-col-resize touch-none md:block"
        onPointerDown={beginResize}
      >
        <div className="mx-auto h-full w-px bg-[var(--app-panel-border)] transition-colors hover:bg-teal-400" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col pl-0 md:pl-2">
        <header className="flex min-h-14 items-center gap-3 border-b border-[var(--app-panel-border)] px-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Editor
            </p>
            <h2 className="truncate text-sm font-semibold">{activeNote.title}</h2>
          </div>
          <IconButton
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            label="Delete note"
            onClick={() => useWorkspaceStore.getState().setDeleteConfirmIds([activeNote.id])}
          >
            <Trash2 size={18} />
          </IconButton>
          <IconButton label="Close editor" onClick={() => selectNotes([])}>
            <X size={18} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <section className="border-b border-[var(--app-panel-border)] p-5">
            <div className="mb-4">
              <label
                className="text-xs font-bold uppercase tracking-wide text-[var(--app-accent)]"
                htmlFor="inspector-title"
              >
                Note Title
              </label>
              <input
                id="inspector-title"
                className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-base font-semibold"
                value={activeNote.title}
                onChange={(event) =>
                  updateNote(activeNote.id, { title: event.target.value })
                }
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  aria-label={`Use color ${color}`}
                  className={cn(
                    "focus-ring h-9 w-9 rounded-lg border transition",
                    activeNote.color === color
                      ? "border-teal-500 ring-2 ring-teal-400/50"
                      : "border-slate-900/20"
                  )}
                  style={{ background: color }}
                  onClick={() => updateNote(activeNote.id, { color })}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Tags (comma separated)
                </span>
                <input
                  className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm"
                  value={activeNote.tags.join(", ")}
                  onChange={(event) =>
                    updateNote(activeNote.id, { tags: splitTags(event.target.value) })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Organize in Group
                </span>
                <select
                  className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm"
                  value={activeNote.groupId ?? ""}
                  onChange={(event) =>
                    updateNote(activeNote.id, {
                      groupId: event.target.value || undefined
                    })
                  }
                >
                  <option value="">No group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                aria-label="New group name"
                className="focus-ring min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm"
                placeholder="Create new group..."
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
              <IconButton
                className="h-11 w-11"
                label="Create group"
                onClick={() => {
                  const trimmed = groupName.trim();
                  if (!trimmed) return;
                  const id = addGroup(trimmed, activeNote.color);
                  updateNote(activeNote.id, { groupId: id });
                  setGroupName("");
                }}
              >
                <FolderPlus size={18} />
              </IconButton>
            </div>
          </section>

          <div className="min-h-[420px] p-1 bg-black/5 dark:bg-white/5 border-b border-[var(--app-panel-border)]">
            <MarkdownEditor
              value={activeNote.content}
              onChange={(content) => updateNote(activeNote.id, { content })}
            />
          </div>

          <section className="border-t border-[var(--app-panel-border)] p-5">
            <div className="mb-5 flex items-center gap-2">
              <Cable size={17} className="text-[var(--app-accent)]" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--app-text)]">Connections</h2>
                <p className="text-xs text-[var(--app-muted)]">
                  {connected.length} linked note{connected.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] p-3">
              <label className="block text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Target Note
                </span>
                <select
                  aria-label="Connection target"
                  className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[var(--app-panel-border)] bg-transparent px-3 py-2 text-sm"
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                >
                  <option value="">Choose a note</option>
                  {notes
                    .filter((note) => note.id !== activeNote.id)
                    .map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.title}
                      </option>
                    ))}
                </select>
              </label>

              <label className="mt-3 block text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Relationship Type
                </span>
                <select
                  aria-label="Connection type"
                  className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[var(--app-panel-border)] bg-transparent px-3 py-2 text-sm"
                  value={connectionType}
                  onChange={(event) =>
                    setConnectionType(event.target.value as ConnectionType)
                  }
                >
                  {Object.entries(CONNECTION_STYLES).map(([type, style]) => (
                    <option key={type} value={type}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Label
                </span>
                <input
                  aria-label="Connection label"
                  className="focus-ring mt-2 min-h-11 w-full rounded-lg border border-[var(--app-panel-border)] bg-transparent px-3 py-2 text-sm"
                  placeholder="Optional label"
                  value={connectionLabel}
                  onChange={(event) => setConnectionLabel(event.target.value)}
                />
              </label>

              <TextButton
                className="mt-4 w-full"
                disabled={!targetId}
                onClick={() => {
                  if (!targetId) return;
                  addConnection(
                    activeNote.id,
                    targetId,
                    connectionType,
                    connectionLabel.trim()
                  );
                  setTargetId("");
                  setConnectionLabel("");
                }}
                tone="primary"
              >
                Add Connection
              </TextButton>
            </div>

            <div className="mt-4 space-y-2">
              {connected.map((connection) => {
                const peerId =
                  connection.sourceId === activeNote.id
                    ? connection.targetId
                    : connection.sourceId;
                const peer = notes.find((note) => note.id === peerId);
                const style = CONNECTION_STYLES[connection.type];
                return (
                  <div
                    key={connection.id}
                    className="rounded-xl border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: style.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          aria-label="Edit connection label"
                          className="focus-ring w-full rounded-md border border-transparent bg-transparent px-1 text-sm font-semibold outline-none focus:border-[var(--app-panel-border)]"
                          placeholder={peer?.title ?? peerId}
                          value={connection.label}
                          onChange={(event) =>
                            updateConnection(connection.id, {
                              label: event.target.value
                            })
                          }
                        />
                        <select
                          aria-label="Edit connection type"
                          className="focus-ring mt-2 min-h-10 rounded-lg border border-[var(--app-panel-border)] bg-transparent px-2 py-1.5 text-xs font-medium text-[var(--app-muted)]"
                          value={connection.type}
                          onChange={(event) =>
                            updateConnection(connection.id, {
                              type: event.target.value as ConnectionType
                            })
                          }
                        >
                          {Object.entries(CONNECTION_STYLES).map(([type, item]) => (
                            <option key={type} value={type}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <IconButton
                        className="h-10 w-10"
                        label="Delete connection"
                        onClick={() => deleteConnection(connection.id)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </motion.aside>
  );
}
