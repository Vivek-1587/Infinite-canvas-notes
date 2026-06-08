"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";

export function useTheme(): void {
  const theme = useWorkspaceStore((state) => state.settings.theme);
  const reducedMotion = useWorkspaceStore((state) => state.settings.reducedMotion);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const shouldUseDark = theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", shouldUseDark);
      root.style.colorScheme = shouldUseDark ? "dark" : "light";
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-reduced-motion", reducedMotion ? "true" : "false");
  }, [reducedMotion]);
}
