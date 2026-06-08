"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import { CONNECTION_STYLES } from "@/lib/constants";
import { computeForceLayout } from "@/lib/graph/layout";
import { useWorkspaceStore } from "@/store/workspace-store";

export function GraphView() {
  const notes = useWorkspaceStore((state) => state.notes);
  const connections = useWorkspaceStore((state) => state.connections);
  const activeNoteId = useWorkspaceStore((state) => state.activeNoteId);
  const query = useWorkspaceStore((state) => state.searchQuery.trim().toLowerCase());
  const selectNote = useWorkspaceStore((state) => state.selectNote);
  const setActivePanel = useWorkspaceStore((state) => state.setActivePanel);

  const layout = useMemo(
    () => computeForceLayout(notes, connections),
    [connections, notes]
  );
  const layoutById = useMemo(
    () => new Map(layout.map((node) => [node.id, node])),
    [layout]
  );

  const nodes: Node[] = useMemo(
    () =>
      notes.map((note) => {
        const positioned = layoutById.get(note.id);
        const matches =
          query.length > 0 &&
          `${note.title} ${note.content} ${note.tags.join(" ")}`
            .toLowerCase()
            .includes(query);

        const selected = activeNoteId === note.id;

        return {
          id: note.id,
          position: { x: positioned?.x ?? note.x / 2, y: positioned?.y ?? note.y / 2 },
          data: {
            label: (
              <div className="min-w-36 max-w-56 rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 shadow-sm">
                <div className="truncate text-sm font-bold">{note.title}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(note.tags.length ? note.tags.slice(0, 2) : ["untagged"]).map(
                    (tag) => (
                      <span
                        className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--app-muted)] dark:bg-white/10"
                        key={tag}
                      >
                        #{tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            )
          },
          style: {
            background: "transparent",
            border: "none",
            boxShadow: selected
              ? "0 0 0 5px rgba(20,184,166,0.52)"
              : matches
                ? "0 0 0 4px rgba(20,184,166,0.42)"
                : "none",
            padding: 0,
            transition: "transform 220ms ease, box-shadow 220ms ease"
          }
        };
      }),
    [activeNoteId, layoutById, notes, query]
  );

  const edges: Edge[] = useMemo(
    () =>
      connections.map((connection) => {
        const style = CONNECTION_STYLES[connection.type];
        return {
          id: connection.id,
          source: connection.sourceId,
          target: connection.targetId,
          label: connection.label || style.label,
          animated: connection.type === "supports",
          type: "smoothstep",
          style: {
            stroke: style.color,
            strokeWidth: 2,
            strokeDasharray: style.dasharray
          },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 6,
          labelBgStyle: {
            fill: "var(--app-panel-solid)",
            fillOpacity: 0.9
          },
          labelStyle: {
            fill: "var(--app-text)",
            fontSize: 12,
            fontWeight: 700
          }
        };
      }),
    [connections]
  );

  return (
    <main
      className="relative h-full flex-1 overflow-hidden bg-transparent"
      data-testid="graph-view"
    >
      <div className="absolute left-4 top-4 z-20">
        <div className="glass-panel rounded-xl px-4 py-3">
          <h2 className="text-sm font-semibold">Graph View</h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {notes.length} notes, {connections.length} connections
          </p>
        </div>
      </div>
      <ReactFlow
        edges={edges}
        fitView
        nodes={nodes}
        nodesDraggable={false}
        onNodeClick={(_, node) => {
          selectNote(node.id);
          setActivePanel("notes");
        }}
      >
        <Background color="var(--app-grid)" gap={28} />
        <Controls position="bottom-left" />
        <MiniMap
          pannable
          position="bottom-right"
          zoomable
          nodeColor={(node) => {
            const note = notes.find((item) => item.id === node.id);
            return note?.color ?? "#14b8a6";
          }}
        />
      </ReactFlow>
    </main>
  );
}
