"use client";

import { useRef, useState } from "react";
import { FileArchive, FileCode2, ImageDown, Loader2, Upload } from "lucide-react";
import { TextButton } from "@/components/ui/text-button";
import {
  exportCanvasPng,
  exportCanvasSvg,
  exportJson,
  exportMarkdownZip
} from "@/lib/export/exporter";
import type { Workspace } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useWorkspaceStore } from "@/store/workspace-store";

type ExportJob = "json" | "markdown" | "png" | "svg" | null;

function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Workspace>;
  return (
    Array.isArray(candidate.notes) &&
    Array.isArray(candidate.connections) &&
    typeof candidate.settings === "object" &&
    candidate.settings !== null
  );
}

export function ExportPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [job, setJob] = useState<ExportJob>(null);
  const [error, setError] = useState<string | null>(null);
  const workspace = useWorkspaceStore(useShallow((state) => state.getWorkspace()));
  const estimate = useWorkspaceStore((state) => state.storageEstimate);
  const refreshStorageEstimate = useWorkspaceStore(
    (state) => state.refreshStorageEstimate
  );
  const replaceWorkspace = useWorkspaceStore((state) => state.replaceWorkspace);

  const run = async (
    nextJob: Exclude<ExportJob, null>,
    task: () => Promise<void> | void
  ) => {
    setJob(nextJob);
    try {
      await task();
      await refreshStorageEstimate();
    } finally {
      setJob(null);
    }
  };

  const importJson = async (file: File) => {
    setError(null);
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    const wrappedWorkspace =
      parsed && typeof parsed === "object" && "workspace" in parsed
        ? (parsed as { workspace?: unknown }).workspace
        : undefined;
    const nextWorkspace = isWorkspace(wrappedWorkspace) ? wrappedWorkspace : parsed;
    if (!isWorkspace(nextWorkspace)) {
      throw new Error("Invalid workspace file");
    }
    replaceWorkspace({
      groups: nextWorkspace.groups ?? [],
      notes: nextWorkspace.notes,
      connections: nextWorkspace.connections,
      settings: nextWorkspace.settings
    });
    await refreshStorageEstimate();
  };

  return (
    <section className="glass-panel absolute bottom-4 right-4 top-20 z-40 w-[380px] overflow-auto rounded-xl p-4">
      <h2 className="text-base font-bold">Export</h2>
      <div className="mt-4 grid gap-2">
        <TextButton
          className="justify-start"
          disabled={job !== null}
          onClick={() => run("json", () => exportJson(workspace))}
        >
          {job === "json" ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <FileCode2 size={17} />
          )}
          JSON graph
        </TextButton>
        <TextButton
          className="justify-start"
          disabled={job !== null}
          onClick={() => run("markdown", () => exportMarkdownZip(workspace))}
        >
          {job === "markdown" ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <FileArchive size={17} />
          )}
          Markdown ZIP
        </TextButton>
        <TextButton
          className="justify-start"
          disabled={job !== null}
          onClick={() =>
            run("png", async () => {
              useWorkspaceStore.getState().setExportState("png");
              await new Promise((resolve) => setTimeout(resolve, 150));
              const target = document.getElementById("canvas-export-target");
              if (target) await exportCanvasPng(target);
              useWorkspaceStore.getState().setExportState(null);
            })
          }
        >
          {job === "png" ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <ImageDown size={17} />
          )}
          PNG image
        </TextButton>
        <TextButton
          className="justify-start"
          disabled={job !== null}
          onClick={() =>
            run("svg", async () => {
              useWorkspaceStore.getState().setExportState("svg");
              await new Promise((resolve) => setTimeout(resolve, 150));
              const target = document.getElementById("canvas-export-target");
              if (target) await exportCanvasSvg(target);
              useWorkspaceStore.getState().setExportState(null);
            })
          }
        >
          {job === "svg" ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <ImageDown size={17} />
          )}
          SVG image
        </TextButton>
        <TextButton
          className="justify-start"
          disabled={job !== null}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={17} />
          Import JSON
        </TextButton>
        <input
          ref={inputRef}
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void importJson(file).catch((reason: unknown) => {
              setError(
                reason instanceof Error ? reason.message : "Could not import workspace"
              );
            });
            event.target.value = "";
          }}
          type="file"
        />
      </div>
      {error ? (
        <div className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      <div className="mt-5 rounded-lg border border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Storage</span>
          <span className="text-[var(--app-muted)]">
            {estimate
              ? `${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)}`
              : "Unavailable"}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ width: `${Math.min(100, (estimate?.usageRatio ?? 0) * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
