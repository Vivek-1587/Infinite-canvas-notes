"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { TextButton } from "@/components/ui/text-button";

export function DeleteConfirmationModal() {
  const deleteConfirmIds = useWorkspaceStore((state) => state.deleteConfirmIds);
  const setDeleteConfirmIds = useWorkspaceStore((state) => state.setDeleteConfirmIds);
  const deleteNotes = useWorkspaceStore((state) => state.deleteNotes);

  if (!deleteConfirmIds || deleteConfirmIds.length === 0) return null;

  const count = deleteConfirmIds.length;

  const handleConfirm = () => {
    deleteNotes(deleteConfirmIds);
    setDeleteConfirmIds(null);
  };

  const handleCancel = () => {
    setDeleteConfirmIds(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[var(--app-text)]">
              Delete {count === 1 ? "Note" : `${count} Notes`}
            </h3>
            <p className="mt-2 text-sm text-[var(--app-muted)] leading-relaxed">
              Are you sure you want to delete {count === 1 ? "this note" : "these notes"}?
              This action cannot be undone and will cascade delete all related connections.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <TextButton onClick={handleCancel}>
            Cancel
          </TextButton>
          <button
            onClick={handleConfirm}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500 active:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
