export type ConnectionType = "related" | "causes" | "references" | "supports" | "custom";

export type ThemeMode = "dark" | "light" | "system";

export type CanvasTool = "select" | "pan" | "connect";

export interface Note {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  color: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  groupId?: string;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type: ConnectionType;
}

export interface NoteGroup {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Settings {
  theme: ThemeMode;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  reducedMotion: boolean;
  peerSyncEnabled: boolean;
}

export interface Workspace {
  notes: Note[];
  connections: Connection[];
  groups: NoteGroup[];
  settings: Settings;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StorageEstimateView {
  quota: number;
  usage: number;
  usageRatio: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  workspace: Omit<Workspace, "settings">;
}
