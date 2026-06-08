"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { CommandPalette } from "@/components/command-palette";
import { ExportPanel } from "@/components/export-panel";
import { GraphView } from "@/components/graph/graph-view";
import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";
import { NoteInspector } from "@/components/note-inspector";
import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePersistedWorkspace } from "@/hooks/use-persisted-workspace";
import { useTheme } from "@/hooks/use-theme";
import { useWorkspaceStore } from "@/store/workspace-store";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

export function AppShell() {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  usePersistedWorkspace();
  useTheme();

  const activePanel = useWorkspaceStore((state) => state.activePanel);
  const hasHydrated = useWorkspaceStore((state) => state.hasHydrated);
  const setActivePanel = useWorkspaceStore((state) => state.setActivePanel);
  const viewport = useWorkspaceStore((state) => state.viewport);
  const reducedMotion = useWorkspaceStore((state) => state.settings.reducedMotion);

  const getCanvasCenter = useCallback(
    () => ({
      x:
        (window.innerWidth / 2 - (sidebarCollapsed ? 72 : 260) - viewport.x) /
        viewport.zoom,
      y: (window.innerHeight / 2 - 64 - viewport.y) / viewport.zoom
    }),
    [sidebarCollapsed, viewport]
  );

  useKeyboardShortcuts({
    getCanvasCenter,
    onExport: () => setActivePanel("export"),
    onSearch: () => searchRef.current?.focus()
  });

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
      <div className="flex h-screen w-screen overflow-hidden text-[var(--app-text)]">
        {sidebarMobileOpen ? (
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        ) : null}
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={sidebarMobileOpen}
          onCloseMobile={() => setSidebarMobileOpen(false)}
          onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar ref={searchRef} onOpenSidebar={() => setSidebarMobileOpen(true)} />
          <div className="relative min-h-0 flex-1">
            {activePanel === "graph" ? <GraphView /> : <InfiniteCanvas />}
            {activePanel !== "graph" &&
            activePanel !== "export" &&
            activePanel !== "settings" ? (
              <AnimatePresence>
                <NoteInspector />
              </AnimatePresence>
            ) : null}
            {activePanel === "export" ? <ExportPanel /> : null}
            {activePanel === "settings" ? <SettingsPanel /> : null}
            {!hasHydrated ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 grid place-items-center bg-[var(--app-bg)]"
                initial={{ opacity: 0 }}
              >
                <div className="glass-panel rounded-xl px-5 py-4 text-sm font-semibold">
                  Loading workspace
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
        <CommandPalette />
        <DeleteConfirmationModal />
      </div>
    </MotionConfig>
  );
}
