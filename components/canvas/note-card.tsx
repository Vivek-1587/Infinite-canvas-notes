"use client";

import { memo, type PointerEvent } from "react";
import { Cable, GitBranch, Tags, Trash2 } from "lucide-react";
import { NOTE_HEIGHT, NOTE_WIDTH } from "@/lib/constants";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { IconButton } from "@/components/ui/icon-button";

interface NoteCardProps {
  connectSourceId: string | null;
  connectionCount: number;
  isActive: boolean;
  isSearchMatch: boolean;
  isSelected: boolean;
  note: Note;
  onConnect: (noteId: string) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>, note: Note) => void;
  onTitleChange: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export const NoteCard = memo(function NoteCard({
  connectSourceId,
  connectionCount,
  isActive,
  isSearchMatch,
  isSelected,
  note,
  onConnect,
  onPointerDown,
  onTitleChange,
  onDelete
}: NoteCardProps) {
  const connectingFromThis = connectSourceId === note.id;

  return (
    <article
      data-note-id={note.id}
      data-testid="canvas-note"
      className={cn(
        "group absolute select-none overflow-hidden rounded-xl border bg-white/72 shadow-lg backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-900/15",
        isSelected
          ? "border-teal-500 ring-2 ring-teal-400/45"
          : "border-slate-900/10 hover:border-teal-400/70",
        isActive && "shadow-[0_22px_60px_rgba(20,184,166,0.25)]",
        isSearchMatch && "note-search-pulse border-teal-500 ring-2 ring-teal-300/70"
      )}
      style={{
        width: NOTE_WIDTH,
        height: NOTE_HEIGHT,
        transform: `translate3d(${note.x}px, ${note.y}px, 0)`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${note.color} 88%, white), ${note.color})`,
        color: "#172033"
      }}
      onPointerDown={(event) => onPointerDown(event, note)}
    >
      <header className="flex h-14 items-center gap-2 border-b border-slate-900/10 bg-white/50 px-3">
        <input
          aria-label={`Title for ${note.title}`}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-base font-bold leading-tight outline-none focus:border-slate-900/20 focus:bg-white/45"
          value={note.title}
          onChange={(event) => onTitleChange(note.id, event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
        />
        <IconButton
          className="h-11 w-11 border-slate-900/10 bg-white/55 text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          label="Delete note"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(note.id);
          }}
          type="button"
        >
          <Trash2 size={16} />
        </IconButton>
        <IconButton
          active={connectingFromThis}
          className="h-11 w-11 border-slate-900/10 bg-white/55 text-slate-700 hover:bg-white/80"
          label={connectingFromThis ? "Pick target note" : "Connect note"}
          onClick={(event) => {
            event.stopPropagation();
            onConnect(note.id);
          }}
          type="button"
        >
          <Cable size={16} />
        </IconButton>
      </header>

      <div className="h-[120px] overflow-hidden px-4 py-3">
        <MarkdownPreview content={note.content} />
      </div>

      <footer className="absolute bottom-0 left-0 right-0 flex h-12 items-center gap-2 border-t border-slate-900/10 bg-white/50 px-3 text-xs text-slate-700">
        <Tags size={14} aria-hidden />
        <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
          {note.tags.length > 0 ? (
            note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-900/10 px-1.5 py-0.5 font-medium"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-slate-600">untagged</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/10 px-1.5 py-1 font-semibold">
          <GitBranch size={13} />
          {connectionCount}
        </span>
      </footer>
    </article>
  );
});
