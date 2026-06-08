"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { Point } from "@/lib/types";

interface KeyboardShortcutOptions {
  getCanvasCenter: () => Point;
  onExport: () => void;
  onSearch: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable
  );
}

export function useKeyboardShortcuts({
  getCanvasCenter,
  onExport,
  onSearch
}: KeyboardShortcutOptions): void {
  const createNote = useWorkspaceStore((state) => state.createNote);
  const deleteSelectedNotes = useWorkspaceStore((state) => state.deleteSelectedNotes);
  const setCommandPaletteOpen = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const undo = useWorkspaceStore((state) => state.undo);
  const redo = useWorkspaceStore((state) => state.redo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && key === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (modifier && key === "f") {
        event.preventDefault();
        onSearch();
        return;
      }

      if (modifier && key === "s") {
        event.preventDefault();
        onExport();
        return;
      }

      if (modifier && key === "z") {
        if (!isTypingTarget(event.target)) {
          event.preventDefault();
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        return;
      }

      if (modifier && key === "y") {
        if (!isTypingTarget(event.target)) {
          event.preventDefault();
          redo();
        }
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (!isTypingTarget(event.target)) {
          event.preventDefault();
          deleteSelectedNotes();
        }
        return;
      }

      if (!modifier && key === "n" && !isTypingTarget(event.target)) {
        event.preventDefault();
        createNote(getCanvasCenter());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    createNote,
    deleteSelectedNotes,
    getCanvasCenter,
    onExport,
    onSearch,
    setCommandPaletteOpen,
    undo,
    redo
  ]);
}
