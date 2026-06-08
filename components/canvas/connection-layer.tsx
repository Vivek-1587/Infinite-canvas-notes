"use client";

import { memo } from "react";
import { CONNECTION_STYLES, NOTE_HEIGHT, NOTE_WIDTH } from "@/lib/constants";
import type { Connection, Note } from "@/lib/types";

interface ConnectionLayerProps {
  connections: Connection[];
  notes: Note[];
}

function pathFor(source: Note, target: Note): string {
  const x1 = source.x + NOTE_WIDTH / 2;
  const y1 = source.y + NOTE_HEIGHT / 2;
  const x2 = target.x + NOTE_WIDTH / 2;
  const y2 = target.y + NOTE_HEIGHT / 2;
  const dx = Math.max(120, Math.abs(x2 - x1) * 0.42);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function midpoint(source: Note, target: Note) {
  return {
    x: (source.x + target.x) / 2 + NOTE_WIDTH / 2,
    y: (source.y + target.y) / 2 + NOTE_HEIGHT / 2
  };
}

export const ConnectionLayer = memo(function ConnectionLayer({
  connections,
  notes
}: ConnectionLayerProps) {
  const noteMap = new Map(notes.map((note) => [note.id, note]));

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      style={{ width: 1, height: 1 }}
      aria-hidden
    >
      <defs>
        {Object.entries(CONNECTION_STYLES).map(([type, style]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            markerHeight="10"
            markerUnits="strokeWidth"
            markerWidth="10"
            orient="auto"
            refX="9"
            refY="3"
            viewBox="0 0 10 6"
          >
            <path d="M0,0 L10,3 L0,6 Z" fill={style.color} />
          </marker>
        ))}
      </defs>
      {connections.map((connection) => {
        const source = noteMap.get(connection.sourceId);
        const target = noteMap.get(connection.targetId);
        if (!source || !target) return null;
        const style = CONNECTION_STYLES[connection.type];
        const label = connection.label || style.label;
        const labelPoint = midpoint(source, target);
        const labelWidth = Math.min(180, Math.max(64, label.length * 8 + 20));

        return (
          <g key={connection.id}>
            <path
              d={pathFor(source, target)}
              fill="none"
              markerEnd={`url(#arrow-${connection.type})`}
              stroke={style.color}
              strokeDasharray={style.dasharray}
              strokeLinecap="round"
              strokeWidth={3}
            />
            <g
              transform={`translate(${labelPoint.x - labelWidth / 2}, ${labelPoint.y - 14})`}
            >
              <rect
                width={labelWidth}
                height={28}
                rx={8}
                fill="var(--app-panel-solid)"
                opacity={0.92}
                stroke={style.color}
                strokeOpacity={0.38}
              />
              <text
                x={labelWidth / 2}
                y={18}
                fill="var(--app-text)"
                fontSize={12}
                fontWeight={650}
                textAnchor="middle"
              >
                {label.length > 20 ? `${label.slice(0, 17)}...` : label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
});
