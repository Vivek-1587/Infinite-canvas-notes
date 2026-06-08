import { toPng, toSvg } from "html-to-image";
import JSZip from "jszip";
import { NOTE_HEIGHT, NOTE_WIDTH } from "@/lib/constants";
import type { Note, Workspace } from "@/lib/types";
import { downloadBlob, slugify } from "@/lib/utils";

export interface MarkdownArchiveEntry {
  path: string;
  content: string;
}

export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "Infinite Canvas Notes",
      version: 1,
      workspace
    },
    null,
    2
  );
}

function frontmatterForNote(note: Note): string {
  return [
    "---",
    `id: ${note.id}`,
    `title: ${JSON.stringify(note.title)}`,
    `x: ${note.x}`,
    `y: ${note.y}`,
    `color: ${note.color}`,
    `tags: [${note.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
    `createdAt: ${note.createdAt}`,
    `updatedAt: ${note.updatedAt}`,
    note.groupId ? `groupId: ${note.groupId}` : undefined,
    "---"
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildMarkdownArchiveEntries(
  workspace: Workspace
): MarkdownArchiveEntry[] {
  const entries = workspace.notes.map((note) => {
    const name = slugify(note.title) || note.id;
    return {
      path: `notes/${name}.md`,
      content: `${frontmatterForNote(note)}\n\n${note.content}\n`
    };
  });

  const connections = workspace.connections
    .map((connection) => {
      const source = workspace.notes.find((note) => note.id === connection.sourceId);
      const target = workspace.notes.find((note) => note.id === connection.targetId);
      return `- ${source?.title ?? connection.sourceId} -> ${
        target?.title ?? connection.targetId
      } (${connection.type})${connection.label ? `: ${connection.label}` : ""}`;
    })
    .join("\n");

  return [
    ...entries,
    {
      path: "connections.md",
      content: `# Connections\n\n${connections || "No connections yet."}\n`
    },
    {
      path: "workspace.json",
      content: serializeWorkspace(workspace)
    }
  ];
}

export async function createMarkdownZip(workspace: Workspace): Promise<Blob> {
  const zip = new JSZip();
  for (const entry of buildMarkdownArchiveEntries(workspace)) {
    zip.file(entry.path, entry.content);
  }
  return zip.generateAsync({ type: "blob" });
}

export function exportJson(workspace: Workspace): void {
  downloadBlob(
    new Blob([serializeWorkspace(workspace)], { type: "application/json" }),
    "infinite-canvas-notes.json"
  );
}

export async function exportMarkdownZip(workspace: Workspace): Promise<void> {
  const blob = await createMarkdownZip(workspace);
  downloadBlob(blob, "infinite-canvas-notes-markdown.zip");
}

export async function exportCanvasPng(target: HTMLElement): Promise<void> {
  const dataUrl = await toPng(target, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: getComputedStyle(document.documentElement)
      .getPropertyValue("--app-bg")
      .trim()
  });
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  downloadBlob(blob, "infinite-canvas-notes.png");
}

export async function exportCanvasSvg(target: HTMLElement): Promise<void> {
  const dataUrl = await toSvg(target, {
    cacheBust: true,
    backgroundColor: getComputedStyle(document.documentElement)
      .getPropertyValue("--app-bg")
      .trim()
  });
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  downloadBlob(blob, "infinite-canvas-notes.svg");
}

export function getExportBounds(workspace: Workspace) {
  if (workspace.notes.length === 0) {
    return { x: 0, y: 0, width: NOTE_WIDTH, height: NOTE_HEIGHT };
  }

  const minX = Math.min(...workspace.notes.map((note) => note.x));
  const minY = Math.min(...workspace.notes.map((note) => note.y));
  const maxX = Math.max(...workspace.notes.map((note) => note.x + NOTE_WIDTH));
  const maxY = Math.max(...workspace.notes.map((note) => note.y + NOTE_HEIGHT));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
