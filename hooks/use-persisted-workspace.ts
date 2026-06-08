"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";

export function usePersistedWorkspace(): void {
  const hydrate = useWorkspaceStore((state) => state.hydrate);
  const hasHydrated = useWorkspaceStore((state) => state.hasHydrated);
  const refreshStorageEstimate = useWorkspaceStore(
    (state) => state.refreshStorageEstimate
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hasHydrated) return;
    const interval = window.setInterval(() => {
      void refreshStorageEstimate();
    }, 20_000);

    return () => window.clearInterval(interval);
  }, [hasHydrated, refreshStorageEstimate]);
}
