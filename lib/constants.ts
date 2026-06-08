import type { ConnectionType, Settings } from "@/lib/types";

export const NOTE_WIDTH = 300;
export const NOTE_HEIGHT = 220;
export const NOTE_RADIUS = 8;
export const MIN_ZOOM = 0.18;
export const MAX_ZOOM = 2.8;
export const CANVAS_MARGIN = 900;
export const DEFAULT_GRID_SIZE = 32;

export const NOTE_COLORS = [
  "#fef3c7",
  "#d9f99d",
  "#bfdbfe",
  "#ddd6fe",
  "#fecdd3",
  "#ccfbf1",
  "#fde68a",
  "#e5e7eb"
] as const;

export const CONNECTION_STYLES: Record<
  ConnectionType,
  { label: string; color: string; dasharray?: string }
> = {
  related: { label: "Related", color: "#22c55e" },
  causes: { label: "Causes", color: "#f97316" },
  references: { label: "References", color: "#3b82f6", dasharray: "7 5" },
  supports: { label: "Supports", color: "#a855f7" },
  custom: { label: "Custom", color: "#64748b", dasharray: "3 4" }
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  showGrid: true,
  snapToGrid: false,
  gridSize: DEFAULT_GRID_SIZE,
  reducedMotion: false,
  peerSyncEnabled: false
};

export const EMPTY_MARKDOWN = `# Untitled

Start writing in **Markdown**.
`;
