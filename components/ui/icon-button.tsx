"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
  children: ReactNode;
}

export function IconButton({
  active,
  className,
  label,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm transition",
        active
          ? "border-teal-400 bg-teal-500/20 text-teal-700 dark:text-teal-200"
          : "border-transparent text-[var(--app-muted)] hover:border-[var(--app-panel-border)] hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
