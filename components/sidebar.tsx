"use client";

import type { ComponentType } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Network,
  Settings,
  Tags,
  X
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useWorkspaceStore, type SidebarPanel } from "@/store/workspace-store";

const panels: Array<{
  id: SidebarPanel;
  label: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "tags", label: "Tags", icon: Tags },
  { id: "graph", label: "Graph", icon: Network },
  { id: "export", label: "Export", icon: Download },
  { id: "settings", label: "Settings", icon: Settings }
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed
}: SidebarProps) {
  const activePanel = useWorkspaceStore((state) => state.activePanel);
  const applyTemplate = useWorkspaceStore((state) => state.applyTemplate);
  const filteredNotes = useWorkspaceStore(useShallow((state) => state.getFilteredNotes()));
  const notes = useWorkspaceStore((state) => state.notes);
  const searchQuery = useWorkspaceStore((state) => state.searchQuery);
  const selectedNoteIds = useWorkspaceStore((state) => state.selectedNoteIds);
  const selectNote = useWorkspaceStore((state) => state.selectNote);
  const setActivePanel = useWorkspaceStore((state) => state.setActivePanel);

  const tagCounts = notes.reduce<Record<string, number>>((accumulator, note) => {
    for (const tag of note.tags) accumulator[tag] = (accumulator[tag] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <aside
      className={cn(
        "glass-panel fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col rounded-none border-y-0 border-l-0 transition-all duration-200 ease-out lg:relative lg:translate-x-0",
        collapsed ? "lg:w-[72px]" : "lg:w-[260px]",
        mobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full"
      )}
    >
      <div className="border-b border-[var(--app-panel-border)] px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-500 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20">
            IC
          </div>
          <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
            <h1 data-testid="app-title" className="truncate text-base font-bold">Infinite Canvas Notes</h1>
            <p className="text-xs text-[var(--app-muted)]">{notes.length} notes</p>
          </div>
          <IconButton
            className="h-11 w-11 lg:hidden"
            label="Close sidebar"
            onClick={onCloseMobile}
          >
            <X size={18} />
          </IconButton>
        </div>
      </div>

      <nav
        className={cn(
          "grid gap-1 border-b border-[var(--app-panel-border)] p-2",
          collapsed ? "lg:grid-cols-1" : "grid-cols-5"
        )}
      >
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              aria-label={panel.label}
              title={panel.label}
              className={cn(
                "focus-ring grid min-h-11 place-items-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/10",
                activePanel === panel.id &&
                  "bg-teal-500/20 text-teal-700 dark:text-teal-200"
              )}
              onClick={() => {
                setActivePanel(panel.id);
                useWorkspaceStore.getState().setSearchQuery("");
                onCloseMobile();
              }}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </nav>

      <div className={cn("min-h-0 flex-1 overflow-auto p-3", collapsed && "lg:hidden")}>
        {activePanel === "notes" ? (
          <div className="space-y-2" data-testid="notes-list">
            {(searchQuery ? filteredNotes : notes).map((note) => (
              <button
                key={note.id}
                className={cn(
                  "focus-ring w-full rounded-lg border p-3 text-left transition",
                  selectedNoteIds.includes(note.id)
                    ? "border-teal-400 bg-teal-500/15"
                    : "border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] hover:bg-black/5 dark:hover:bg-white/10"
                )}
                onClick={() => {
                  selectNote(note.id);
                  onCloseMobile();
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-slate-900/15"
                    style={{ background: note.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {note.title}
                  </span>
                </div>
                <div className="mt-2 line-clamp-2 text-xs text-[var(--app-muted)]">
                  {note.content.replace(/[#*_`>\-[\]]/g, " ").trim()}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {activePanel === "tags" ? (
          <div className="space-y-2">
            {Object.entries(tagCounts).length > 0 ? (
              Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <button
                    key={tag}
                    className="focus-ring flex w-full items-center justify-between rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => {
                      useWorkspaceStore.getState().setSearchQuery(tag);
                      onCloseMobile();
                    }}
                  >
                    <span className="font-medium">#{tag}</span>
                    <span className="text-xs text-[var(--app-muted)]">{count}</span>
                  </button>
                ))
            ) : (
              <div className="rounded-lg border border-[var(--app-panel-border)] p-3 text-sm text-[var(--app-muted)]">
                No tags yet
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-5">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
            Templates
          </h2>
          <div className="grid gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                className="focus-ring rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => {
                  applyTemplate(template.id);
                  onCloseMobile();
                }}
              >
                <div className="text-sm font-semibold">{template.name}</div>
                <div className="mt-1 text-xs text-[var(--app-muted)]">
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden border-t border-[var(--app-panel-border)] p-2 lg:block">
        <IconButton
          className="h-11 w-full"
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </IconButton>
      </div>
    </aside>
  );
}
