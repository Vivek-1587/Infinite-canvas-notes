"use client";

import { Grid2X2, RadioTower, Save } from "lucide-react";
import { TextButton } from "@/components/ui/text-button";
import type { ThemeMode } from "@/lib/types";
import { useWorkspaceStore } from "@/store/workspace-store";

const themes: ThemeMode[] = ["system", "light", "dark"];

export function SettingsPanel() {
  const settings = useWorkspaceStore((state) => state.settings);
  const updateSettings = useWorkspaceStore((state) => state.updateSettings);

  return (
    <section className="glass-panel absolute bottom-4 right-4 top-20 z-40 w-[380px] overflow-auto rounded-xl p-4">
      <h2 className="text-base font-bold">Settings</h2>
      <div className="mt-4 space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => (
              <TextButton
                active={settings.theme === theme}
                key={theme}
                onClick={() => updateSettings({ theme })}
              >
                {theme}
              </TextButton>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
            <Grid2X2 size={15} /> Canvas
          </h3>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm">
            <span>Grid</span>
            <input
              checked={settings.showGrid}
              onChange={(event) => updateSettings({ showGrid: event.target.checked })}
              type="checkbox"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm">
            <span>Snap</span>
            <input
              checked={settings.snapToGrid}
              onChange={(event) => updateSettings({ snapToGrid: event.target.checked })}
              type="checkbox"
            />
          </label>
          <label className="block rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm">
            <span className="flex items-center justify-between">
              <span>Grid size</span>
              <span className="text-[var(--app-muted)]">{settings.gridSize}px</span>
            </span>
            <input
              className="mt-3 w-full accent-teal-500"
              max={72}
              min={16}
              onChange={(event) =>
                updateSettings({ gridSize: Number(event.target.value) })
              }
              step={4}
              type="range"
              value={settings.gridSize}
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm">
            <span>Reduced motion</span>
            <input
              checked={settings.reducedMotion}
              onChange={(event) =>
                updateSettings({ reducedMotion: event.target.checked })
              }
              type="checkbox"
            />
          </label>
        </section>

        <section className="space-y-3 opacity-60">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
            <RadioTower size={15} /> Peer Sync (Experimental)
          </h3>
          <div
            className="flex items-center justify-between gap-4 rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm cursor-help"
            title="Collaboration features are planned for a future release."
          >
            <span>WebRTC sync</span>
            <span className="text-xs text-[var(--app-muted)] font-medium">Coming soon</span>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
            <Save size={15} /> Persistence
          </h3>
          <div className="rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] px-3 py-2 text-sm text-[var(--app-muted)]">
            IndexedDB
          </div>
        </section>
      </div>
    </section>
  );
}
