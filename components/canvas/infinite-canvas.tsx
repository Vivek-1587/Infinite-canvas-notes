"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
  type WheelEvent
} from "react";
import { FilePlus2 } from "lucide-react";
import Fuse from "fuse.js";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { ConnectionLayer } from "@/components/canvas/connection-layer";
import { Minimap } from "@/components/canvas/minimap";
import { NoteCard } from "@/components/canvas/note-card";
import {
  CANVAS_MARGIN,
  MAX_ZOOM,
  MIN_ZOOM,
  NOTE_HEIGHT,
  NOTE_WIDTH
} from "@/lib/constants";
import type { Note, Point, Rect, Viewport } from "@/lib/types";
import { clamp, normalizeRect, rectsIntersect, screenToWorld } from "@/lib/utils";
import { useElementSize } from "@/hooks/use-element-size";
import { useSpacebar } from "@/hooks/use-spacebar";
import { useWorkspaceStore } from "@/store/workspace-store";

type DragState =
  | {
      type: "pan";
      pointerId: number;
      start: Point;
      origin: Viewport;
    }
  | {
      type: "note";
      pointerId: number;
      lastWorld: Point;
      noteIds: string[];
    }
  | {
      type: "select";
      pointerId: number;
      startWorld: Point;
      currentWorld: Point;
    };

function noteRect(note: Note): Rect {
  return { x: note.x, y: note.y, width: NOTE_WIDTH, height: NOTE_HEIGHT };
}

function zoomAroundPoint(
  viewport: Viewport,
  nextZoom: number,
  point: Point,
  rect: Pick<DOMRect, "left" | "top">
): Viewport {
  const world = screenToWorld(point, viewport, rect);
  return {
    zoom: nextZoom,
    x: point.x - rect.left - world.x * nextZoom,
    y: point.y - rect.top - world.y * nextZoom
  };
}

export function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedSearchRef = useRef("");
  const pinchRef = useRef<{ distance: number; viewport: Viewport } | null>(null);
  const size = useElementSize(containerRef);
  const spacebarPressed = useSpacebar();
  const [dragState, setDragState] = useState<DragState | null>(null);

  const notes = useWorkspaceStore((state) => state.notes);
  const connections = useWorkspaceStore((state) => state.connections);
  const groups = useWorkspaceStore((state) => state.groups);
  const viewport = useWorkspaceStore((state) => state.viewport);
  const selectedNoteIds = useWorkspaceStore((state) => state.selectedNoteIds);
  const activeNoteId = useWorkspaceStore((state) => state.activeNoteId);
  const canRedo = useWorkspaceStore((state) => state.canRedo);
  const canUndo = useWorkspaceStore((state) => state.canUndo);
  const connectSourceId = useWorkspaceStore((state) => state.connectSourceId);
  const searchQuery = useWorkspaceStore((state) => state.searchQuery);
  const tool = useWorkspaceStore((state) => state.tool);
  const settings = useWorkspaceStore((state) => state.settings);
  const addConnection = useWorkspaceStore((state) => state.addConnection);
  const commitNotes = useWorkspaceStore((state) => state.commitNotes);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const moveNotesBy = useWorkspaceStore((state) => state.moveNotesBy);
  const redo = useWorkspaceStore((state) => state.redo);
  const selectNote = useWorkspaceStore((state) => state.selectNote);
  const selectNotes = useWorkspaceStore((state) => state.selectNotes);
  const setConnectSource = useWorkspaceStore((state) => state.setConnectSource);
  const setTool = useWorkspaceStore((state) => state.setTool);
  const setViewport = useWorkspaceStore((state) => state.setViewport);
  const undo = useWorkspaceStore((state) => state.undo);
  const updateNote = useWorkspaceStore((state) => state.updateNote);
  const exportState = useWorkspaceStore((state) => state.exportState);
  const setDeleteConfirmIds = useWorkspaceStore((state) => state.setDeleteConfirmIds);

  const exportPadding = 80;
  const exportBounds = useMemo(() => {
    if (notes.length === 0) {
      return { x: 0, y: 0, width: NOTE_WIDTH, height: NOTE_HEIGHT };
    }
    const minX = Math.min(...notes.map((note) => note.x));
    const minY = Math.min(...notes.map((note) => note.y));
    const maxX = Math.max(...notes.map((note) => note.x + NOTE_WIDTH));
    const maxY = Math.max(...notes.map((note) => note.y + NOTE_HEIGHT));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [notes]);

  const allGroupBounds = useMemo(() => {
    return groups
      .map((group) => {
        const groupNotes = notes.filter((note) => note.groupId === group.id);
        if (groupNotes.length === 0) return null;
        const minX = Math.min(...groupNotes.map((note) => note.x)) - 34;
        const minY = Math.min(...groupNotes.map((note) => note.y)) - 48;
        const maxX = Math.max(...groupNotes.map((note) => note.x + NOTE_WIDTH)) + 34;
        const maxY = Math.max(...groupNotes.map((note) => note.y + NOTE_HEIGHT)) + 34;
        return {
          group,
          rect: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
        };
      })
      .filter((item): item is { group: typeof groups[0]; rect: Rect } => item !== null);
  }, [groups, notes]);

  const trimmedSearch = searchQuery.trim();

  const searchResultNotes = useMemo(() => {
    if (!trimmedSearch) return [];
    const fuse = new Fuse(notes, {
      keys: ["title", "content", "tags"],
      threshold: 0.32,
      ignoreLocation: true,
      minMatchCharLength: 2
    });
    return fuse.search(trimmedSearch).map((result) => result.item);
  }, [notes, trimmedSearch]);

  const searchResultIds = useMemo(
    () => new Set(searchResultNotes.map((note) => note.id)),
    [searchResultNotes]
  );

  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const connection of connections) {
      counts.set(connection.sourceId, (counts.get(connection.sourceId) ?? 0) + 1);
      counts.set(connection.targetId, (counts.get(connection.targetId) ?? 0) + 1);
    }
    return counts;
  }, [connections]);

  const visibleWorld = useMemo(() => {
    const margin = CANVAS_MARGIN / viewport.zoom;
    return {
      x: -viewport.x / viewport.zoom - margin,
      y: -viewport.y / viewport.zoom - margin,
      width: size.width / viewport.zoom + margin * 2,
      height: size.height / viewport.zoom + margin * 2
    };
  }, [size.height, size.width, viewport]);

  const visibleNotes = useMemo(
    () => notes.filter((note) => rectsIntersect(noteRect(note), visibleWorld)),
    [notes, visibleWorld]
  );

  const visibleNoteIds = useMemo(
    () => new Set(visibleNotes.map((note) => note.id)),
    [visibleNotes]
  );

  const visibleConnections = useMemo(
    () =>
      connections.filter(
        (connection) =>
          visibleNoteIds.has(connection.sourceId) ||
          visibleNoteIds.has(connection.targetId)
      ),
    [connections, visibleNoteIds]
  );

  const groupBounds = useMemo(() => {
    return groups
      .map((group) => {
        const groupNotes = notes.filter((note) => note.groupId === group.id);
        if (groupNotes.length === 0) return null;
        const minX = Math.min(...groupNotes.map((note) => note.x)) - 34;
        const minY = Math.min(...groupNotes.map((note) => note.y)) - 48;
        const maxX = Math.max(...groupNotes.map((note) => note.x + NOTE_WIDTH)) + 34;
        const maxY = Math.max(...groupNotes.map((note) => note.y + NOTE_HEIGHT)) + 34;
        const rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        return rectsIntersect(rect, visibleWorld) ? { group, rect } : null;
      })
      .filter(Boolean);
  }, [groups, notes, visibleWorld]);

  const getCenterWorld = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return screenToWorld(
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      viewport,
      rect
    );
  }, [viewport]);

  const setZoom = useCallback(
    (nextZoom: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setViewport(
        zoomAroundPoint(
          viewport,
          clamp(nextZoom, MIN_ZOOM, MAX_ZOOM),
          { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          rect
        )
      );
    },
    [setViewport, viewport]
  );

  const fitCanvas = useCallback(() => {
    if (notes.length === 0 || size.width === 0 || size.height === 0) return;
    const minX = Math.min(...notes.map((note) => note.x));
    const minY = Math.min(...notes.map((note) => note.y));
    const maxX = Math.max(...notes.map((note) => note.x + NOTE_WIDTH));
    const maxY = Math.max(...notes.map((note) => note.y + NOTE_HEIGHT));
    const worldWidth = maxX - minX + 260;
    const worldHeight = maxY - minY + 260;
    const zoom = clamp(
      Math.min(size.width / worldWidth, size.height / worldHeight),
      MIN_ZOOM,
      1.35
    );
    setViewport({
      zoom,
      x: size.width / 2 - (minX + (maxX - minX) / 2) * zoom,
      y: size.height / 2 - (minY + (maxY - minY) / 2) * zoom
    });
  }, [notes, setViewport, size.height, size.width]);

  useEffect(() => {
    if (
      !trimmedSearch ||
      searchResultNotes.length === 0 ||
      size.width === 0 ||
      size.height === 0
    ) {
      lastFocusedSearchRef.current = trimmedSearch;
      return;
    }
    if (lastFocusedSearchRef.current === trimmedSearch) return;
    const first = searchResultNotes[0];
    if (!first) return;
    const zoom = clamp(Math.max(viewport.zoom, 0.9), MIN_ZOOM, 1.25);
    setViewport({
      zoom,
      x: size.width / 2 - (first.x + NOTE_WIDTH / 2) * zoom,
      y: size.height / 2 - (first.y + NOTE_HEIGHT / 2) * zoom
    });
    lastFocusedSearchRef.current = trimmedSearch;
  }, [
    searchResultNotes,
    setViewport,
    size.height,
    size.width,
    trimmedSearch,
    viewport.zoom
  ]);

  const onWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (
        spacebarPressed ||
        event.shiftKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ) {
        setViewport({
          ...viewport,
          x: viewport.x - event.deltaX,
          y: viewport.y - event.deltaY
        });
        return;
      }

      const zoomFactor = Math.exp(-event.deltaY * 0.0012);
      const nextZoom = clamp(viewport.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
      setViewport(
        zoomAroundPoint(viewport, nextZoom, { x: event.clientX, y: event.clientY }, rect)
      );
    },
    [setViewport, spacebarPressed, viewport]
  );

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (event.touches.length !== 2) return;
      const [first, second] = Array.from(event.touches);
      pinchRef.current = {
        distance: Math.hypot(
          first.clientX - second.clientX,
          first.clientY - second.clientY
        ),
        viewport
      };
    },
    [viewport]
  );

  const onTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (event.touches.length !== 2 || !pinchRef.current) return;
      event.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const [first, second] = Array.from(event.touches);
      const distance = Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY
      );
      const midpoint = {
        x: (first.clientX + second.clientX) / 2,
        y: (first.clientY + second.clientY) / 2
      };
      const nextZoom = clamp(
        pinchRef.current.viewport.zoom * (distance / pinchRef.current.distance),
        MIN_ZOOM,
        MAX_ZOOM
      );
      setViewport(zoomAroundPoint(pinchRef.current.viewport, nextZoom, midpoint, rect));
    },
    [setViewport]
  );

  const beginPan = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state: DragState = {
        type: "pan",
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        origin: viewport
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragState(state);
    },
    [viewport]
  );

  const onCanvasPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 && event.button !== 1) return;
      if (
        spacebarPressed ||
        tool === "pan" ||
        event.button === 1 ||
        event.pointerType === "touch"
      ) {
        beginPan(event);
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport, rect);
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragState({
        type: "select",
        pointerId: event.pointerId,
        startWorld: world,
        currentWorld: world
      });
      selectNotes([]);
    },
    [beginPan, selectNotes, spacebarPressed, tool, viewport]
  );

  const onNotePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>, note: Note) => {
      if (event.button !== 0) return;
      event.stopPropagation();

      if (tool === "connect") {
        if (connectSourceId && connectSourceId !== note.id) {
          addConnection(connectSourceId, note.id);
        } else {
          setConnectSource(note.id);
        }
        return;
      }

      const mode =
        event.shiftKey || event.metaKey || event.ctrlKey ? "toggle" : "replace";
      const alreadySelected = selectedNoteIds.includes(note.id);
      if (!alreadySelected || mode === "toggle") {
        selectNote(note.id, mode);
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport, rect);
      const noteIds = alreadySelected ? selectedNoteIds : [note.id];
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragState({
        type: "note",
        pointerId: event.pointerId,
        lastWorld: world,
        noteIds
      });
    },
    [
      addConnection,
      connectSourceId,
      selectNote,
      selectedNoteIds,
      setConnectSource,
      tool,
      viewport
    ]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (dragState.type === "pan") {
        setViewport({
          ...dragState.origin,
          x: dragState.origin.x + event.clientX - dragState.start.x,
          y: dragState.origin.y + event.clientY - dragState.start.y
        });
        return;
      }

      const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport, rect);
      if (dragState.type === "note") {
        const delta = {
          x: world.x - dragState.lastWorld.x,
          y: world.y - dragState.lastWorld.y
        };
        moveNotesBy(dragState.noteIds, delta);
        setDragState({ ...dragState, lastWorld: world });
        return;
      }

      setDragState({ ...dragState, currentWorld: world });
    },
    [dragState, moveNotesBy, setViewport, viewport]
  );

  const finishDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      if (dragState.type === "note") {
        commitNotes(dragState.noteIds);
      }

      if (dragState.type === "select") {
        const rect = normalizeRect(dragState.startWorld, dragState.currentWorld);
        const selected = notes
          .filter((note) => rectsIntersect(rect, noteRect(note)))
          .map((note) => note.id);
        selectNotes(selected);
      }

      setDragState(null);
    },
    [commitNotes, dragState, notes, selectNotes]
  );

  const onDoubleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      createNote(screenToWorld({ x: event.clientX, y: event.clientY }, viewport, rect));
    },
    [createNote, viewport]
  );

  const selectionRect =
    dragState?.type === "select"
      ? normalizeRect(dragState.startWorld, dragState.currentWorld)
      : null;

  const gridSize = settings.gridSize * viewport.zoom;
  const cursor =
    spacebarPressed || tool === "pan"
      ? "cursor-grab active:cursor-grabbing"
      : "cursor-crosshair";

  return (
    <main
      ref={containerRef}
      className={`relative h-full flex-1 overflow-hidden ${cursor}`}
      data-testid="infinite-canvas"
      onDoubleClick={onDoubleClick}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onTouchMove={onTouchMove}
      onTouchStart={onTouchStart}
      onWheel={onWheel}
      style={{
        touchAction: "none",
        backgroundColor: "transparent",
        backgroundImage: settings.showGrid
          ? "linear-gradient(var(--app-grid) 1px, transparent 1px), linear-gradient(90deg, var(--app-grid) 1px, transparent 1px)"
          : undefined,
        backgroundPosition: `${viewport.x % gridSize}px ${viewport.y % gridSize}px`,
        backgroundSize: `${gridSize}px ${gridSize}px`
      }}
    >
      <CanvasToolbar
        activeTool={tool}
        canRedo={canRedo}
        canUndo={canUndo}
        onCreateNote={() => createNote(getCenterWorld())}
        onFit={fitCanvas}
        onRedo={redo}
        onReset={() => setViewport({ x: 420, y: 260, zoom: 1 })}
        onToolChange={setTool}
        onUndo={undo}
        onZoomIn={() => setZoom(viewport.zoom * 1.18)}
        onZoomOut={() => setZoom(viewport.zoom / 1.18)}
        zoom={viewport.zoom}
      />

      {trimmedSearch ? (
        <div className="glass-panel pointer-events-none absolute left-4 top-20 z-30 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--app-text)]">
          {searchResultNotes.length} Result{searchResultNotes.length === 1 ? "" : "s"}{" "}
          Found
        </div>
      ) : null}

      <div
        data-canvas-export-root
        className="absolute left-0 top-0 h-full w-full origin-top-left"
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
          transformOrigin: "0 0"
        }}
      >
        {groupBounds.map((item) =>
          item ? (
            <div
              key={item.group.id}
              className="pointer-events-none absolute rounded-xl border-2 border-dashed bg-white/5"
              style={{
                transform: `translate3d(${item.rect.x}px, ${item.rect.y}px, 0)`,
                width: item.rect.width,
                height: item.rect.height,
                borderColor: item.group.color
              }}
            >
              <div
                className="absolute left-4 top-3 rounded-md px-2 py-1 text-xs font-bold"
                style={{ background: item.group.color, color: "#111827" }}
              >
                {item.group.name}
              </div>
            </div>
          ) : null
        )}

        <ConnectionLayer connections={visibleConnections} notes={notes} />

        {visibleNotes.map((note) => (
          <NoteCard
            key={note.id}
            connectSourceId={connectSourceId}
            connectionCount={connectionCounts.get(note.id) ?? 0}
            isActive={activeNoteId === note.id}
            isSearchMatch={searchResultIds.has(note.id)}
            isSelected={selectedNoteIds.includes(note.id)}
            note={note}
            onConnect={(noteId) => {
              if (connectSourceId && connectSourceId !== noteId)
                addConnection(connectSourceId, noteId);
              else setConnectSource(noteId);
            }}
            onPointerDown={onNotePointerDown}
            onTitleChange={(id, title) => updateNote(id, { title })}
            onDelete={(id) => setDeleteConfirmIds([id])}
          />
        ))}

        {selectionRect ? (
          <div
            className="pointer-events-none absolute rounded-lg border border-teal-400 bg-teal-400/15"
            style={{
              transform: `translate3d(${selectionRect.x}px, ${selectionRect.y}px, 0)`,
              width: selectionRect.width,
              height: selectionRect.height
            }}
          />
        ) : null}
      </div>

      <Minimap
        notes={notes}
        viewport={viewport}
        width={size.width}
        height={size.height}
      />
      <button
        className="focus-ring group absolute bottom-36 right-4 z-30 flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-teal-500 text-slate-950 shadow-xl shadow-teal-500/25 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-400 hover:shadow-2xl"
        onClick={() => createNote(getCenterWorld())}
        title="Create note"
        type="button"
      >
        <FilePlus2 size={22} />
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          New note
        </span>
      </button>

      {exportState ? (
        <div
          id="canvas-export-target"
          style={{
            position: "fixed",
            left: "-99999px",
            top: "-99999px",
            width: `${exportBounds.width + exportPadding * 2}px`,
            height: `${exportBounds.height + exportPadding * 2}px`,
            pointerEvents: "none",
            background: "var(--app-bg)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              transform: `translate(${-exportBounds.x + exportPadding}px, ${-exportBounds.y + exportPadding}px)`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              position: "relative"
            }}
          >
            {allGroupBounds.map((item) => (
              <div
                key={item.group.id}
                className="pointer-events-none absolute rounded-xl border-2 border-dashed bg-white/5"
                style={{
                  transform: `translate3d(${item.rect.x}px, ${item.rect.y}px, 0)`,
                  width: item.rect.width,
                  height: item.rect.height,
                  borderColor: item.group.color
                }}
              >
                <div
                  className="absolute left-4 top-3 rounded-md px-2 py-1 text-xs font-bold"
                  style={{ background: item.group.color, color: "#111827" }}
                >
                  {item.group.name}
                </div>
              </div>
            ))}

            <ConnectionLayer connections={connections} notes={notes} />

            {notes.map((note) => (
              <NoteCard
                key={note.id}
                connectSourceId={null}
                connectionCount={connectionCounts.get(note.id) ?? 0}
                isActive={false}
                isSearchMatch={false}
                isSelected={false}
                note={note}
                onConnect={() => {}}
                onPointerDown={() => {}}
                onTitleChange={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
