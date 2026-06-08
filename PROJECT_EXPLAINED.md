# Project Explained — Infinite Canvas Notes

> This document explains how the application works from the inside, written for a beginner developer who has some React and JavaScript experience but is new to this codebase.

---

## 1. What Is This Application?

Infinite Canvas Notes is a **local-first** web application. "Local-first" means that all your data is stored on your own computer (in the browser), not on a remote server. You can use it entirely offline. No account, no login, no cloud storage.

Technically it is a **Next.js 15 app** (using the App Router) written in TypeScript. The UI is built with React. Data is stored in IndexedDB using a library called Dexie. The state between components is managed with Zustand.

---

## 2. How Data Flows Through the App

Here is the journey data takes from the moment you type something to the moment it is saved:

```
User action (e.g., types in the editor)
        ↓
React component's onChange handler fires
        ↓
Calls a Zustand store action (e.g., updateNote)
        ↓
Zustand updates the in-memory state immediately (React re-renders)
        ↓
Store action calls a DB function (e.g., saveNote) in the background
        ↓
Dexie writes the change to IndexedDB in the browser
        ↓
Data is now persisted — survives page refresh
```

The key insight is that the **store (memory) is the source of truth** for the UI, while **IndexedDB is the durable backup**. When the page loads, the app reads from IndexedDB and populates the in-memory store — this is called "hydration".

---

## 3. How Notes Are Stored

### In Memory (Zustand Store)
Every note is a JavaScript object of type `Note`:
```typescript
type Note = {
  id: string;        // e.g. "note_abc123"
  title: string;     // "My Idea"
  content: string;   // "# My Idea\n\nMarkdown text here."
  x: number;         // canvas world X position (pixels)
  y: number;         // canvas world Y position (pixels)
  color: string;     // "#a5f3fc" — one of 8 preset colours
  tags: string[];    // ["ideas", "planning"]
  groupId?: string;  // optional reference to a NoteGroup
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number; // Unix timestamp (ms)
};
```

All notes live in a flat array: `state.notes: Note[]`.

### In IndexedDB (Dexie)
The database is named `InfiniteCanvasNotes` and has four tables:

| Table | Stores | Primary key |
|---|---|---|
| `notes` | All Note objects | `id` |
| `connections` | All Connection objects | `id` |
| `groups` | All NoteGroup objects | `id` |
| `settings` | One Settings record | Fixed key `"settings"` |

Dexie is a wrapper around the browser's IndexedDB API that makes it feel more like a regular JavaScript database. For example:
```typescript
// Read all notes:
const notes = await db.notes.toArray();

// Save/overwrite one note:
await db.notes.put(note);  // "put" = insert-or-update

// Delete a note by id:
await db.notes.bulkDelete(["note_abc123"]);
```

### Fallback When IndexedDB Is Unavailable
If the browser blocks IndexedDB (e.g. private browsing with strict settings), the app switches to an **in-memory fallback** (`memoryWorkspace`). This means the app still works — but any changes are lost when you close the tab.

---

## 4. How Hydration Works

"Hydration" is the process of loading data from IndexedDB into the in-memory store when the app first opens.

1. The `AppShell` component renders a `usePersistedWorkspace` hook.
2. That hook calls `store.hydrate()` once on mount (it guards against running twice with an `isHydrating` flag).
3. `hydrate()` calls `loadWorkspace()` from `lib/db.ts`, which:
   - First seeds the database if it is empty (inserts the starter Mind Map template).
   - Then reads all notes, connections, groups, and settings from IndexedDB in parallel.
4. The data is set on the Zustand store: `{ notes, connections, groups, settings, hasHydrated: true }`.
5. A loading overlay is shown while `hasHydrated` is `false`, then disappears.

```
App mounts
  → usePersistedWorkspace()
    → store.hydrate()
      → loadWorkspace() reads IndexedDB
        → seedIfNeeded() (only on first-ever load)
      → setState({ notes, connections, groups, hasHydrated: true })
  → Loading overlay disappears
  → Canvas renders with all notes
```

---

## 5. How Connections Work

A **connection** is a directed relationship between two notes:
```typescript
type Connection = {
  id: string;
  sourceId: string;   // id of the "from" note
  targetId: string;   // id of the "to" note
  type: ConnectionType; // "related" | "supports" | "causes" | "references" | "contradicts"
  label: string;      // optional text label (can be empty)
};
```

Connections are stored in `state.connections: Connection[]` — just a flat list.

### How connection lines are drawn on the canvas
The `ConnectionLayer` component (`components/canvas/connection-layer.tsx`) renders an SVG overlay that covers the entire canvas. For each visible connection, it:
1. Looks up the `(x, y)` position of the source and target notes.
2. Calculates the centre of each note card.
3. Draws an SVG `<line>` between them with the stroke style and colour matching the connection type.

Only connections where at least one endpoint (source or target) is currently in the visible viewport are rendered — this keeps performance good when you have hundreds of connections.

### How connection logic is enforced
The `addConnection` action has two guards:
- **No self-connection:** `if (sourceId === targetId) return null;`
- **No duplicate:** Checks if a connection of the same type between the same pair already exists.

---

## 6. How Graph View Works

Graph View is a completely different rendering mode from the canvas. Instead of placing notes at their (x, y) positions, it uses a **force simulation** to calculate positions based on relationships.

### Step 1 — Build the simulation (D3 force)
`lib/graph/layout.ts` takes all notes and connections and runs a D3 force simulation:

```typescript
const simulation = forceSimulation(nodes)
  .force("link", forceLink(links).distance(170))    // pull connected notes together
  .force("charge", forceManyBody().strength(-520))  // push all notes apart
  .force("collide", forceCollide(96))               // prevent overlap
  .force("center", forceCenter(0, 0))               // pull all toward origin
  .force("cluster-x", forceX(...))                  // group by tag/group (horizontal)
  .force("cluster-y", forceY(...))                  // group by tag/group (vertical)
  .stop();

// Run 180 iterations synchronously (not animated)
for (let i = 0; i < 180; i++) simulation.tick();
```

The result is a list of `{ id, x, y, cluster }` objects representing where each note should appear.

### Step 2 — Render with React Flow
`components/graph/graph-view.tsx` converts the notes and connections into React Flow `Node` and `Edge` objects and passes them to `<ReactFlow>`. React Flow handles all the pan/zoom and rendering within the graph.

- Notes → `Node[]` (each with `position: { x, y }` from the D3 layout)
- Connections → `Edge[]` (each with stroke style from `CONNECTION_STYLES`)

### Step 3 — Interaction
Clicking a node calls:
```typescript
onNodeClick={(_, node) => {
  selectNote(node.id);  // marks this note as active in the store
  setActivePanel("notes"); // switches back to canvas view
}}
```

Graph View is **read-only** (`nodesDraggable={false}`) — you can explore but not edit from here.

---

## 7. How IndexedDB Is Used

The `lib/db.ts` file owns all database operations. Here is a walkthrough of each function and when it is called:

| Function | When called | What it does |
|---|---|---|
| `loadWorkspace()` | On app startup (hydration) | Reads all 4 tables; seeds if empty; returns Workspace |
| `saveNote(note)` | After `createNote` or `updateNote` | Inserts or updates one note |
| `saveNotes(notes[])` | After drag move commits | Bulk-updates multiple notes |
| `deleteNotes(ids[])` | After `deleteSelectedNotes` | Removes notes + their connections in a transaction |
| `saveConnection(conn)` | After `addConnection` or `updateConnection` | Inserts or updates one connection |
| `deleteConnection(id)` | After `deleteConnection` | Removes one connection |
| `saveGroups(groups[])` | After `addGroup` | Bulk-overwrites the entire groups table |
| `saveSettings(settings)` | After `updateSettings` | Overwrites the single settings record |
| `replaceWorkspace(ws)` | After import, undo, redo, or template apply | Clears all 4 tables and re-inserts everything in a transaction |

**Important:** All DB operations are `async` (they return Promises) but are called with `void` — meaning the UI does not wait for them to complete. The in-memory store is updated immediately (synchronously), and the DB write happens in the background. This is why the app feels instant even with IndexedDB latency.

---

## 8. How the Undo/Redo System Works

Every time you make a significant change (create, delete, connect, import, template apply), the current workspace state is first **snapshotted** and pushed onto a history stack.

```typescript
// Before making a change:
remember(state.getWorkspace());   // deep-clones current state into historyPast

// historyPast is a plain module-level array:
let historyPast: Workspace[] = [];
let historyFuture: Workspace[] = [];
```

**Undo** pops the last snapshot from `historyPast`, pushes the current state onto `historyFuture`, and restores the old snapshot.

**Redo** pops from `historyFuture` and restores it.

The history is capped at **40 snapshots** (`historyPast.slice(-39)` keeps only the last 39 entries).

⚠️ One caveat: fine-grained note edits (`updateNote` called on every keystroke) do **not** push to history — only the coarser operations do. This means Ctrl+Z will not undo individual character edits; it will undo at the level of create/delete/connect operations.

---

## 9. How Exports Work

All export logic lives in `lib/export/exporter.ts`.

### JSON Export
```
getWorkspace() → plain JS object (notes, connections, groups, settings)
  → JSON.stringify with metadata (exportedAt, app, version)
  → Blob → downloadBlob() → browser downloads the file
```

### Markdown ZIP Export
```
getWorkspace()
  → buildMarkdownArchiveEntries(workspace)
      → For each note: build YAML frontmatter + note.content → "notes/slug.md"
      → connections index → "connections.md"
      → workspace.json (full JSON inside the zip too)
  → JSZip.generateAsync({ type: "blob" })
  → downloadBlob() → browser downloads a .zip file
```

### PNG/SVG Export
```
document.querySelector("[data-canvas-export-root]")
  → Gets the main div that contains all note cards on the canvas
  → html-to-image.toPng(element, { pixelRatio: 2, backgroundColor })
  → Returns a data URL → fetch(dataUrl) → blob
  → downloadBlob() → browser downloads the image
```

### Import
```
User selects a .json file
  → file.text() reads the file as a string
  → JSON.parse()
  → Validates: must have notes[], connections[], and settings object
  → replaceWorkspace(parsed)
      → push current state to undo history
      → set new state in memory
      → replaceWorkspace() in DB: clear all tables, bulk-insert new data
```

---

## 10. How the Canvas Rendering Works

The canvas is not a `<canvas>` HTML element — it is built entirely from **CSS-transformed `div` elements**.

### The transform trick
There is one parent `div` with a CSS transform applied:
```css
transform: translate3d(420px, 260px, 0) scale(1.0);
```
When the user pans, `translate3d` changes. When they zoom, `scale` changes.
All note cards are absolutely positioned inside this parent using their `(x, y)` world coordinates. Because the parent is transformed as a whole, moving the viewport only updates **one CSS property**, not the position of every individual note. This is why panning and zooming feel instantaneous.

### Viewport state
```typescript
type Viewport = {
  x: number;   // offset in screen pixels
  y: number;   // offset in screen pixels
  zoom: number; // 1.0 = 100%, 0.5 = 50%, 2.0 = 200%
};
```

### Coordinate conversion
Two coordinate systems exist:
- **Screen coordinates:** pixels measured from the top-left of the browser window.
- **World coordinates:** the "real" position of things on the infinite canvas.

The `screenToWorld(point, viewport, rect)` utility converts between them. This is used when you click on the canvas to figure out where in world-space you clicked.

### Virtualization
Rendering thousands of note cards at once would be slow. The canvas keeps a `visibleNotes` list computed from the intersection of each note's bounding box with the current `visibleWorld` rectangle (the area of the canvas currently in view, plus a margin). Only `visibleNotes` are rendered as DOM elements.

---

## 11. How the PWA and Offline Mode Work

### PWA Manifest
`public/manifest.webmanifest` declares the app as installable: it has a name, icons, and `"display": "standalone"`. When Chrome detects this, it shows the "Install app" prompt.

### Service Worker
`public/sw.js` is a hand-written service worker (not generated by a framework). It:
1. On **install:** caches the app shell (`/`, `/manifest.webmanifest`, `/icon.svg`).
2. On **activate:** deletes old caches with different version strings.
3. On **fetch:** for navigation requests, tries the network first, falls back to the cached `/` page; for `/_next/static/` files, serves from cache first (cache-first strategy).

⚠️ The service worker is **only registered in production builds** (the `service-worker-register.tsx` checks `NODE_ENV !== "production"`). Running `npm run dev` will never activate the service worker.

### Why It Works Offline
Your notes are in IndexedDB, not in the service worker cache. Once the app shell is cached by the service worker (which happens after the first production load), subsequent visits load the app from cache. When the app loads, it reads your notes from IndexedDB — which is entirely local. So the experience is fully offline.

---

## 12. Key Files Reference

| File | Role |
|---|---|
| `app/layout.tsx` | Root layout, metadata, service-worker registration |
| `app/page.tsx` | Entry point — renders `<AppShell>` |
| `app/globals.css` | Global CSS variables, utility classes, markdown styles |
| `components/app-shell.tsx` | Top-level layout: sidebar + topbar + canvas + panels |
| `components/canvas/infinite-canvas.tsx` | Main canvas: pan/zoom/drag/select/virtualization |
| `components/canvas/note-card.tsx` | Individual note card component |
| `components/canvas/connection-layer.tsx` | SVG overlay for connection lines |
| `components/canvas/canvas-toolbar.tsx` | Tool selector and zoom controls |
| `components/canvas/minimap.tsx` | Mini overview SVG (display only) |
| `components/graph/graph-view.tsx` | React Flow graph rendering |
| `components/note-inspector.tsx` | Right-side panel for editing note details |
| `components/markdown/markdown-editor.tsx` | Textarea + toolbar + preview for note content |
| `components/sidebar.tsx` | Left navigation, notes list, tags, templates |
| `components/top-bar.tsx` | Search bar, theme toggle, export/settings buttons |
| `components/export-panel.tsx` | Export and import UI |
| `components/settings-panel.tsx` | Settings UI |
| `components/command-palette.tsx` | `Ctrl+K` searchable command menu |
| `store/workspace-store.ts` | All state and actions (Zustand) |
| `lib/db.ts` | All IndexedDB read/write operations (Dexie) |
| `lib/export/exporter.ts` | JSON, Markdown ZIP, PNG, SVG export functions |
| `lib/graph/layout.ts` | D3 force simulation for graph positions |
| `lib/sync/webrtc.ts` | WebRTC P2P sync class (implemented, not wired up) |
| `lib/templates.ts` | Pre-built template workspace definitions |
| `lib/constants.ts` | Colour palettes, default settings, connection styles |
| `lib/types.ts` | All TypeScript type definitions |
| `lib/utils.ts` | Helper functions (clamp, slugify, downloadBlob, etc.) |
| `hooks/use-keyboard-shortcuts.ts` | Global keyboard shortcut bindings |
| `hooks/use-persisted-workspace.ts` | Triggers DB hydration on mount |
| `hooks/use-theme.ts` | Applies theme CSS class to `<html>` |
| `hooks/use-spacebar.ts` | Detects spacebar hold for pan mode |
| `public/sw.js` | Service worker (offline cache) |
| `public/manifest.webmanifest` | PWA manifest |
