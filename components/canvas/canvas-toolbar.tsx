"use client";

import {
  CircleDot,
  FilePlus2,
  Hand,
  Home,
  Maximize2,
  MousePointer2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import type { CanvasTool } from "@/lib/types";

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  canRedo: boolean;
  canUndo: boolean;
  onCreateNote: () => void;
  onFit: () => void;
  onRedo: () => void;
  onReset: () => void;
  onToolChange: (tool: CanvasTool) => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

export function CanvasToolbar({
  activeTool,
  canRedo,
  canUndo,
  onCreateNote,
  onFit,
  onRedo,
  onReset,
  onToolChange,
  onUndo,
  onZoomIn,
  onZoomOut,
  zoom
}: CanvasToolbarProps) {
  return (
    <div className="glass-panel pointer-events-auto sticky left-4 top-4 z-30 inline-flex items-center gap-1 rounded-xl p-1.5">
      <IconButton
        active={activeTool === "select"}
        label="Select"
        onClick={() => onToolChange("select")}
      >
        <MousePointer2 size={17} />
      </IconButton>
      <IconButton
        active={activeTool === "pan"}
        label="Pan"
        onClick={() => onToolChange("pan")}
      >
        <Hand size={17} />
      </IconButton>
      <IconButton
        active={activeTool === "connect"}
        label="Connect"
        onClick={() => onToolChange("connect")}
      >
        <CircleDot size={17} />
      </IconButton>
      <div className="mx-1 h-6 w-px bg-[var(--app-panel-border)]" />
      <IconButton label="Create note" onClick={onCreateNote}>
        <FilePlus2 size={17} />
      </IconButton>
      <IconButton disabled={!canUndo} label="Undo" onClick={onUndo}>
        <RotateCcw size={17} />
      </IconButton>
      <IconButton disabled={!canRedo} label="Redo" onClick={onRedo}>
        <RotateCw size={17} />
      </IconButton>
      <IconButton label="Zoom out" onClick={onZoomOut}>
        <ZoomOut size={17} />
      </IconButton>
      <div className="min-w-14 text-center text-xs font-semibold text-[var(--app-muted)]">
        {Math.round(zoom * 100)}%
      </div>
      <IconButton label="Zoom in" onClick={onZoomIn}>
        <ZoomIn size={17} />
      </IconButton>
      <IconButton label="Fit canvas" onClick={onFit}>
        <Maximize2 size={17} />
      </IconButton>
      <IconButton label="Reset view" onClick={onReset}>
        <Home size={17} />
      </IconButton>
    </div>
  );
}
