"use client";

import { forwardRef } from "react";
import { Download, Menu, Moon, Search, Settings, SunMedium } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useWorkspaceStore } from "@/store/workspace-store";

interface TopBarProps {
  onOpenSidebar: () => void;
}

export const TopBar = forwardRef<HTMLInputElement, TopBarProps>(function TopBar(
  { onOpenSidebar },
  searchRef
) {
  const searchQuery = useWorkspaceStore((state) => state.searchQuery);
  const settings = useWorkspaceStore((state) => state.settings);
  const setActivePanel = useWorkspaceStore((state) => state.setActivePanel);
  const setSearchQuery = useWorkspaceStore((state) => state.setSearchQuery);
  const updateSettings = useWorkspaceStore((state) => state.updateSettings);
  const activePanel = useWorkspaceStore((state) => state.activePanel);

  const isDark = settings.theme === "dark";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--app-panel-border)] px-4">
      <IconButton
        className="h-11 w-11 lg:hidden"
        label="Open sidebar"
        onClick={onOpenSidebar}
      >
        <Menu size={18} />
      </IconButton>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--app-panel-border)] bg-[var(--app-panel)] px-3 py-2 backdrop-blur-xl">
        <Search size={18} className="shrink-0 text-[var(--app-muted)]" />
        <input
          ref={searchRef}
          aria-label="Search notes"
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
          data-testid="global-search"
          placeholder="Search titles, content, tags"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>
      <IconButton
        label={isDark ? "Use light theme" : "Use dark theme"}
        onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
      >
        {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
      </IconButton>
      <IconButton
        active={activePanel === "export"}
        label="Export"
        onClick={() => setActivePanel("export")}
      >
        <Download size={18} />
      </IconButton>
      <IconButton
        active={activePanel === "settings"}
        label="Settings"
        onClick={() => setActivePanel("settings")}
      >
        <Settings size={18} />
      </IconButton>
    </header>
  );
});
