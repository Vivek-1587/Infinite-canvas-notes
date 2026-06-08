"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
  tone?: "default" | "danger" | "primary";
}

export function TextButton({
  active,
  children,
  className,
  tone = "default",
  ...props
}: TextButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
        tone === "primary" &&
          "border-teal-400 bg-teal-500/20 text-teal-800 hover:bg-teal-500/25 dark:text-teal-100",
        tone === "danger" &&
          "border-rose-400/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-200",
        tone === "default" &&
          "border-[var(--app-panel-border)] bg-[var(--app-panel-solid)] text-[var(--app-text)] hover:bg-black/5 dark:hover:bg-white/10",
        active && "border-teal-400 bg-teal-500/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
