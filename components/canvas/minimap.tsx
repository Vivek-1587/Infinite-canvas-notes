"use client";

import { NOTE_HEIGHT, NOTE_WIDTH } from "@/lib/constants";
import type { Note, Viewport } from "@/lib/types";
import { useWorkspaceStore } from "@/store/workspace-store";

interface MinimapProps {
  notes: Note[];
  viewport: Viewport;
  width: number;
  height: number;
}

export function Minimap({ notes, viewport, width, height }: MinimapProps) {
  const setViewport = useWorkspaceStore((state) => state.setViewport);

  const bounds = notes.length
    ? {
        minX: Math.min(...notes.map((note) => note.x)),
        minY: Math.min(...notes.map((note) => note.y)),
        maxX: Math.max(...notes.map((note) => note.x + NOTE_WIDTH)),
        maxY: Math.max(...notes.map((note) => note.y + NOTE_HEIGHT))
      }
    : { minX: -500, minY: -400, maxX: 500, maxY: 400 };

  const worldWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const worldHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(176 / worldWidth, 116 / worldHeight);
  
  const viewportRect = {
    x: (-viewport.x / viewport.zoom - bounds.minX) * scale,
    y: (-viewport.y / viewport.zoom - bounds.minY) * scale,
    width: (width / viewport.zoom) * scale,
    height: (height / viewport.zoom) * scale
  };

  const handleMinimapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left - 12; // 12px padding (p-3)
    const clickY = event.clientY - rect.top - 12;  // 12px padding (p-3)

    const worldX = bounds.minX + clickX / scale;
    const worldY = bounds.minY + clickY / scale;

    setViewport({
      ...viewport,
      x: width / 2 - worldX * viewport.zoom,
      y: height / 2 - worldY * viewport.zoom
    });
  };

  return (
    <div 
      className="glass-panel absolute bottom-4 right-4 z-30 rounded-xl p-3 cursor-pointer select-none hover:border-teal-500/50 transition duration-150"
      onClick={handleMinimapClick}
    >
      <svg width="176" height="116" viewBox="0 0 176 116" aria-label="Canvas minimap">
        <rect width="176" height="116" rx="8" fill="rgba(100,116,139,0.10)" />
        {notes.map((note) => (
          <rect
            key={note.id}
            x={(note.x - bounds.minX) * scale}
            y={(note.y - bounds.minY) * scale}
            width={Math.max(3, NOTE_WIDTH * scale)}
            height={Math.max(3, NOTE_HEIGHT * scale)}
            rx="2"
            fill={note.color}
            stroke="rgba(15,23,42,0.35)"
            strokeWidth="0.6"
          />
        ))}
        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={Math.max(10, viewportRect.width)}
          height={Math.max(8, viewportRect.height)}
          rx="4"
          fill="none"
          stroke="var(--app-accent)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
