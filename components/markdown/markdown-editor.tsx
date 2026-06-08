"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bold,
  CheckSquare,
  Code2,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  Quote,
  Table2
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

type EditorMode = "split" | "edit" | "preview";

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after = before,
  fallback = "text"
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || fallback;
  const next = `${textarea.value.slice(0, start)}${before}${selected}${after}${textarea.value.slice(end)}`;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
  });
  return next;
}

function insertBlock(textarea: HTMLTextAreaElement, block: string): string {
  const start = textarea.selectionStart;
  const prefix = textarea.value.slice(0, start);
  const suffix = textarea.value.slice(textarea.selectionEnd);
  const separator = prefix.endsWith("\n") || prefix.length === 0 ? "" : "\n";
  const next = `${prefix}${separator}${block}${suffix}`;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.selectionStart = start + separator.length + block.length;
    textarea.selectionEnd = textarea.selectionStart;
  });
  return next;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<EditorMode>("split");

  const modeButtons = useMemo(
    () =>
      [
        ["split", "Split"],
        ["edit", "Edit"],
        ["preview", "Preview"]
      ] as const,
    []
  );

  const withTextarea = (operation: (textarea: HTMLTextAreaElement) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    onChange(operation(textarea));
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--app-panel-border)] p-2">
        <IconButton
          label="Heading"
          onClick={() => withTextarea((el) => insertBlock(el, "## Heading\n"))}
        >
          <Heading2 size={17} />
        </IconButton>
        <IconButton
          label="Bold"
          onClick={() => withTextarea((el) => wrapSelection(el, "**", "**", "bold text"))}
        >
          <Bold size={17} />
        </IconButton>
        <IconButton
          label="Italic"
          onClick={() => withTextarea((el) => wrapSelection(el, "*", "*", "italic text"))}
        >
          <Italic size={17} />
        </IconButton>
        <IconButton
          label="Inline code"
          onClick={() => withTextarea((el) => wrapSelection(el, "`", "`", "code"))}
        >
          <Code2 size={17} />
        </IconButton>
        <IconButton
          label="Quote"
          onClick={() => withTextarea((el) => insertBlock(el, "> Quote\n"))}
        >
          <Quote size={17} />
        </IconButton>
        <IconButton
          label="List"
          onClick={() => withTextarea((el) => insertBlock(el, "- Item\n- Item\n"))}
        >
          <List size={17} />
        </IconButton>
        <IconButton
          label="Checklist"
          onClick={() =>
            withTextarea((el) => insertBlock(el, "- [ ] Task\n- [x] Done\n"))
          }
        >
          <CheckSquare size={17} />
        </IconButton>
        <IconButton
          label="Table"
          onClick={() =>
            withTextarea((el) =>
              insertBlock(el, "| Column | Value |\n| --- | --- |\n| Example | Detail |\n")
            )
          }
        >
          <Table2 size={17} />
        </IconButton>
        <IconButton
          label="Link"
          onClick={() =>
            withTextarea((el) => wrapSelection(el, "[", "](https://example.com)", "link"))
          }
        >
          <Link size={17} />
        </IconButton>
        <IconButton
          label="Image"
          onClick={() =>
            withTextarea((el) =>
              insertBlock(el, "![Alt text](https://example.com/image.png)\n")
            )
          }
        >
          <ImageIcon size={17} />
        </IconButton>
        <div className="ml-auto inline-flex rounded-lg border border-[var(--app-panel-border)] bg-black/5 p-1 dark:bg-white/5">
          {modeButtons.map(([key, label]) => (
            <button
              key={key}
              className={`focus-ring rounded-md px-2.5 py-1 text-xs font-medium transition ${
                mode === key
                  ? "bg-[var(--app-panel-solid)] text-[var(--app-text)] shadow-sm"
                  : "text-[var(--app-muted)]"
              }`}
              onClick={() => setMode(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`grid min-h-0 flex-1 ${
          mode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {mode !== "preview" ? (
          <textarea
            ref={textareaRef}
            aria-label="Markdown content"
            className="min-h-[280px] resize-none border-0 border-r border-[var(--app-panel-border)] bg-transparent p-4 font-mono text-sm leading-6 text-[var(--app-text)] outline-none"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck
          />
        ) : null}
        {mode !== "edit" ? (
          <div className="min-h-[280px] overflow-auto p-4">
            <MarkdownPreview content={value} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
