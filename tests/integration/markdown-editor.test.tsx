import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";

describe("MarkdownEditor", () => {
  it("edits markdown and renders a live preview", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MarkdownEditor value={"# Hello\n\n- [x] Ship it"} onChange={onChange} />);

    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
    await user.type(screen.getByLabelText("Markdown content"), "\nNew text");

    expect(onChange).toHaveBeenCalled();
  });
});
