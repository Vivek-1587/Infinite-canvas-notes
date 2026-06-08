# Infinite Canvas Notes – User Guide

Welcome to **Infinite Canvas Notes**, a local-first infinite canvas application for creating, connecting, and exploring your notes visually. Everything is stored in your browser — no account or internet connection required after the first load.

---

## Table of Contents

1. [The Interface](#the-interface)
2. [Getting Started](#getting-started)
3. [Creating a Note](#creating-a-note)
4. [Editing a Note](#editing-a-note)
5. [Moving a Note](#moving-a-note)
6. [Connecting Notes](#connecting-notes)
7. [Deleting Notes](#deleting-notes)
8. [Searching Notes](#searching-notes)
9. [Using Graph View](#using-graph-view)
10. [Exporting Data](#exporting-data)
11. [Importing Data](#importing-data)
12. [Templates](#templates)
13. [Settings](#settings)
14. [Keyboard Shortcuts](#keyboard-shortcuts)
15. [Command Palette](#command-palette)

---

## The Interface

When you open the app you will see:

| Area | What it does |
|---|---|
| **Sidebar** (left) | Navigation between panels: Notes list, Tags, Graph, Export, Settings |
| **Top Bar** (top) | Global search bar, theme toggle, export button, settings button |
| **Canvas** (centre) | Infinite scrollable workspace where your notes live |
| **Note Inspector** (right) | Appears when you select a note; lets you edit title, content, tags, groups, and connections |
| **Canvas Toolbar** (top-left of canvas) | Select, Pan, Connect tools + Undo, Redo, Zoom controls |
| **Minimap** (bottom-right of canvas) | A tiny overview of all your notes' positions |
| **Floating New Note button** (bottom-right) | Green "+" button to quickly add a note |

---

## Getting Started

When you first open the app, a **starter Mind Map workspace** is automatically created and saved to your browser. It contains a few pre-connected sample notes so you can see what the canvas looks like immediately.

You can clear this and start fresh by applying a different template from the sidebar, or simply delete the starter notes.

---

## Creating a Note

There are three ways to create a new note:

1. **Keyboard shortcut** — Press `N` anywhere on the canvas (when not typing in a text field). The note appears at the centre of your current view.
2. **Floating button** — Click the green `+` (FilePlus2) button at the **bottom-right** of the canvas.
3. **Double-click** — Double-click on any **empty area** of the canvas. The note appears exactly where you clicked.
4. **Canvas Toolbar** — Click the FilePlus2 icon in the toolbar at the **top-left** of the canvas.
5. **Command Palette** — Press `Ctrl+K`, search for "New note", and press Enter.

Every new note starts with the title "Untitled Note" and some example Markdown content.

---

## Editing a Note

Click on any note card on the canvas to select it. The **Note Inspector** panel slides in from the right.

Inside the Note Inspector you can:

- **Edit the title** — Type in the "Title" text field at the top of the inspector. Changes save automatically.
- **Change the colour** — Click any of the small colour swatches below the title field. The note card on the canvas updates immediately.
- **Write or edit content** — Use the Markdown editor in the middle of the inspector.
  - The editor has three modes: **Split** (editor + preview side by side), **Edit** (raw Markdown only), and **Preview** (rendered output only).
  - A toolbar of formatting buttons sits above the editor: Heading, Bold, Italic, Inline code, Quote, List, Checklist, Table, Link, and Image.
- **Add tags** — Type comma-separated tags in the "Tags" field (e.g. `ideas, planning, Q4`). Tags appear on the note card and are searchable.
- **Assign a group** — Select an existing group from the "Group" dropdown, or type a name in the "New group" field and click the folder+ icon to create a group.
- **You can also edit the title directly on the note card** by clicking the title text inside the card on the canvas (without opening the inspector).

All edits are **saved automatically** to IndexedDB in your browser. There is no save button — changes persist immediately.

---

## Moving a Note

- **Click and drag** any note card to move it to a new position on the canvas.
- To move **multiple notes** at once: hold `Shift` or `Ctrl`/`Cmd` and click each note to add it to the selection, then drag any of the selected notes. They all move together.
- You can also **drag-select** a rectangle on the canvas background (click and drag on empty canvas space) to select all notes inside the selection rectangle.
- If **Snap to Grid** is enabled in Settings, notes snap to the nearest grid point when you release them.

---

## Connecting Notes

Connections are visual lines drawn between two notes. There are several ways to connect notes:

### Method 1: Connect tool in the Canvas Toolbar
1. Click the **Connect** tool (the circle-dot icon) in the Canvas Toolbar at the top-left.
2. Click the **source note**. Its border highlights.
3. Click the **target note**. A connection line is drawn between them.
4. To stop connecting, click the Select tool.

### Method 2: Connect button on the note card
1. Hover over any note card on the canvas.
2. Click the **cable icon** button in the note's header.
3. The note is now the source. Click another note to create the connection.

### Method 3: Note Inspector connections form
1. Select a note to open the Note Inspector.
2. Scroll to the **Connections** section at the bottom of the inspector.
3. Choose a "Target Note" from the dropdown.
4. Optionally choose a "Relationship Type": Related, Supports, Causes, References, or Contradicts.
5. Optionally add a text label.
6. Click **Add Connection**.

### Managing Connections
In the Connections section of the Note Inspector you can:
- **Edit a connection's label** — Click the label field on an existing connection row.
- **Change the relationship type** — Use the dropdown on the connection row.
- **Delete a connection** — Click the trash icon on the connection row.

---

## Deleting Notes

There is no dedicated delete button on the note card or in the Note Inspector.

To delete notes:

1. **Select** one or more notes (click, or Shift+click multiple, or drag-select a region).
2. Press the `Delete` or `Backspace` key on your keyboard.

> **Important:** Deleting notes also automatically deletes all connections that are attached to those notes.

You can **undo** a deletion immediately with `Ctrl+Z` (or `Cmd+Z` on Mac).

---

## Searching Notes

The **search bar** is located in the Top Bar at the top of the screen.

- Type any words to search across note **titles, content, and tags** simultaneously.
- Results are highlighted on the canvas with a pulsing teal border, and the canvas viewport automatically pans to the first matching note.
- The **Sidebar** Notes list also filters to show only matching notes when a search query is active.
- The count of matching results appears on the canvas (e.g. "3 Results Found").
- **Clear the search bar** to return to normal (all notes visible, no highlights).

### Tag filtering
- Click the **Tags** panel in the sidebar to see a list of all tags with their note counts.
- Click any tag to automatically set it as the search query, filtering notes to only those with that tag.

**Keyboard shortcut:** Press `Ctrl+F` (or `Cmd+F`) to jump focus to the search bar.

---

## Using Graph View

Graph View shows all your notes as **nodes** in a force-directed graph layout. Connected notes are drawn closer together; clusters are formed by tag or group.

To open Graph View:
- Click the **Network (graph) icon** in the Sidebar navigation.
- Or open the Command Palette (`Ctrl+K`) and search for "Open graph view".

In Graph View:
- Each note becomes a card node showing the note title and up to 2 tags.
- Connection lines between notes are drawn with different styles depending on their relationship type (solid, dashed, animated).
- A **search-active** filter highlights matching nodes with a teal glow.
- The **currently selected note** gets a stronger teal ring.
- **Click any node** to select that note and return to the Notes panel (the canvas view is shown again).
- The React Flow toolbar at the **bottom-left** provides zoom in/out and fit controls.
- A **minimap** at the bottom-right shows the full graph layout.

To **leave Graph View**, click any of the other sidebar panel icons (Notes, Tags, Export, Settings).

---

## Exporting Data

Click the **Download icon** in the Top Bar, or click the **Export** item in the Sidebar to open the Export Panel.

Four export formats are available:

| Format | Button Label | What you get |
|---|---|---|
| **JSON** | JSON graph | A `.json` file containing the full workspace (notes, connections, groups, settings) with metadata |
| **Markdown ZIP** | Markdown ZIP | A `.zip` archive with one `.md` file per note (including frontmatter), a `connections.md` index, and a `workspace.json` |
| **PNG image** | PNG image | A `.png` screenshot of the entire canvas (at 2× pixel density) |
| **SVG image** | SVG image | A `.svg` vector image of the canvas |

The panel also shows a **Storage** bar indicating how much browser storage (IndexedDB quota) you are using.

> **Note:** PNG and SVG exports capture the canvas DOM node. These work best when all notes are visible in the viewport or the canvas is fully zoomed out.

**Keyboard shortcut:** Press `Ctrl+S` (or `Cmd+S`) to jump directly to the Export panel.

---

## Importing Data

In the Export Panel, click the **Import JSON** button (Upload icon).

- Your browser's file picker opens. Select a `.json` file previously exported from this app.
- The imported workspace **replaces** the current workspace entirely.
- The previous workspace is pushed to the undo history, so you can press `Ctrl+Z` to recover it immediately.
- Importing validates that the file is a valid workspace object. If the file is not recognised, an error message appears in red.

> **Only JSON format is supported for import.** Markdown ZIP files cannot be imported.

---

## Templates

Templates are pre-built workspace layouts you can insert. They appear in the **Sidebar** below the Notes list or Tags list, in a section labelled "Templates".

Available templates:
- **Mind Map** – A radial brainstorming map with a central idea and 4 branches.
- **Project Planning** – A delivery map with Goal, Scope, Milestones, Risks, and Decision Log notes in two groups.
- **Zettelkasten** – Atomic notes (Source, Claim, Context, Synthesis) linked by references and supports.
- **Research Notes** – A structured canvas for Question, Methods, Evidence, and Insight.

Clicking a template **adds** the template notes to the existing canvas (it does not replace). Notes are offset by 820px if the canvas is not empty.

Templates are also available through the **Command Palette** (`Ctrl+K` → type "Insert").

---

## Settings

Click the **gear icon** in the Top Bar or the Settings icon in the Sidebar to open the Settings Panel.

| Setting | What it does |
|---|---|
| **Theme** | Choose System (follows OS), Light, or Dark. The toggle in the Top Bar also switches between Light and Dark. |
| **Grid** | Show or hide the background dot/line grid on the canvas. |
| **Snap** | When enabled, notes snap to the nearest grid point when you drop them after dragging. |
| **Grid size** | Slider from 16 px to 72 px (step 4). Controls the spacing of the grid and the snap interval. |
| **Reduced motion** | Disables transition animations across the UI. |
| **WebRTC sync** | Enables a peer-to-peer sync toggle (the sync UI is present but requires manual offer/answer exchange; no signalling server is included). |

All settings are persisted automatically to IndexedDB.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `N` | Create a new note at the canvas centre (only when not typing in a field) |
| `Delete` / `Backspace` | Delete selected notes (only when not typing in a field) |
| `Ctrl+Z` / `Cmd+Z` | Undo the last action |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo *(handled by the Redo toolbar button; no global keyboard binding)* |
| `Ctrl+F` / `Cmd+F` | Focus the global search bar |
| `Ctrl+S` / `Cmd+S` | Open the Export panel |
| `Ctrl+K` / `Cmd+K` | Open the Command Palette |
| `Space + Drag` | Pan the canvas (hold Space, then drag) |
| `Scroll Wheel` | Zoom in/out (centred on mouse cursor) |
| `Shift + Scroll` | Pan horizontally |
| `Middle-click + Drag` | Pan the canvas |
| `Pinch (touch)` | Zoom in/out on touch devices |

---

## Command Palette

Press `Ctrl+K` (or `Cmd+K`) to open a searchable command palette. Type to filter the list.

Available commands:
- **New note** – Creates a note at the default position.
- **Open graph view** – Switches to Graph View.
- **Export JSON graph** – Downloads the JSON file immediately.
- **Use dark/light theme** – Toggles the theme.
- **Insert Mind Map** – Applies the Mind Map template.
- **Insert Project Planning** – Applies the Project Planning template.
- **Insert Zettelkasten** – Applies the Zettelkasten template.
- **Insert Research Notes** – Applies the Research Notes template.

Press `Escape` to close the palette without running a command.
