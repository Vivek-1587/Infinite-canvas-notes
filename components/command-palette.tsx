"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Download, FilePlus2, Moon, Network, Search, SunMedium } from "lucide-react";
import { exportJson } from "@/lib/export/exporter";
import { TEMPLATES } from "@/lib/templates";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";

interface CommandAction {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  run: () => void;
}

export function CommandPalette() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const open = useWorkspaceStore((state) => state.commandPaletteOpen);
  const applyTemplate = useWorkspaceStore((state) => state.applyTemplate);
  const createNote = useWorkspaceStore((state) => state.createNote);
  const getWorkspace = useWorkspaceStore((state) => state.getWorkspace);
  const setActivePanel = useWorkspaceStore((state) => state.setActivePanel);
  const setCommandPaletteOpen = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const settings = useWorkspaceStore((state) => state.settings);
  const updateSettings = useWorkspaceStore((state) => state.updateSettings);

  const actions = useMemo<CommandAction[]>(
    () => [
      {
        id: "new-note",
        label: "New note",
        icon: FilePlus2,
        run: () => createNote()
      },
      {
        id: "graph",
        label: "Open graph view",
        icon: Network,
        run: () => setActivePanel("graph")
      },
      {
        id: "export-json",
        label: "Export JSON graph",
        icon: Download,
        run: () => exportJson(getWorkspace())
      },
      {
        id: "toggle-theme",
        label: settings.theme === "dark" ? "Use light theme" : "Use dark theme",
        icon: settings.theme === "dark" ? SunMedium : Moon,
        run: () => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })
      },
      ...TEMPLATES.map((template) => ({
        id: `template-${template.id}`,
        label: `Insert ${template.name}`,
        icon: FilePlus2,
        run: () => applyTemplate(template.id)
      }))
    ],
    [
      applyTemplate,
      createNote,
      getWorkspace,
      setActivePanel,
      settings.theme,
      updateSettings
    ]
  );

  const filtered = actions.filter((action) =>
    action.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCommandPaletteOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setCommandPaletteOpen]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const activeAction = filtered[selectedIndex];
      if (activeAction) {
        activeAction.run();
        setCommandPaletteOpen(false);
        setQuery("");
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="glass-panel mx-auto mt-24 max-w-xl overflow-hidden rounded-xl">
        <div className="flex items-center gap-3 border-b border-[var(--app-panel-border)] px-4 py-3">
          <Search size={18} className="text-[var(--app-muted)]" />
          <input
            ref={inputRef}
            aria-label="Command search"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
        </div>
        <div className="max-h-[52vh] overflow-auto p-2">
          {filtered.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className={cn(
                  "focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition duration-150",
                  selectedIndex === index
                    ? "bg-teal-500/20 text-teal-700 dark:text-teal-200"
                    : "hover:bg-black/5 dark:hover:bg-white/10"
                )}
                onClick={() => {
                  action.run();
                  setCommandPaletteOpen(false);
                  setQuery("");
                }}
              >
                <Icon size={17} className="text-[var(--app-muted)]" />
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
