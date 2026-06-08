# Feature Status — Infinite Canvas Notes

Audit date: **2026-06-06**  
Codebase version: **1.0.0**  
Auditor: Static code analysis + automated test results

Status legend:
- ✅ **Working** — Code is fully implemented, logic is consistent, tests pass or no test failures found.
- ⚠️ **Partially Working** — Feature exists and renders but has known limitations or inconsistencies.
- ❌ **Broken** — Feature is implemented but contains a confirmed bug or a missing critical handler.
- 🔲 **Untested** — Feature exists in code but no automated test covers it and interactive verification was not completed.

---

## Canvas Features

| Feature Name | Purpose | Location | Status | Dependencies | Notes / Example Usage |
|---|---|---|---|---|---|
| Infinite Canvas | Panning, zooming, rendering all notes | `components/canvas/infinite-canvas.tsx` | ✅ Working | Zustand store, viewport state | Mouse wheel to zoom, drag to pan |
| Note Card Rendering | Shows note title, tags, connection count, colour, and a Markdown preview | `components/canvas/note-card.tsx` | ✅ Working | `MarkdownPreview`, store | Virtualized — only visible notes render |
| Canvas Virtualization | Skips rendering notes outside the visible world rect + margin | `infinite-canvas.tsx` (visibleNotes memo) | ✅ Working | `rectsIntersect` util | Keeps canvas smooth with 500+ notes |
| Viewport Pan (mouse drag) | Drag canvas background or hold Space to pan | `infinite-canvas.tsx` | ✅ Working | `useSpacebar` hook | Middle-click also pans |
| Viewport Pan (touch) | Drag canvas on touch devices | `infinite-canvas.tsx` | ✅ Working | PointerEvent handlers | Single-finger drag on touch |
| Pinch-to-zoom (touch) | Two-finger pinch gesture to zoom | `infinite-canvas.tsx` | ✅ Working | `onTouchMove`, `pinchRef` | Preserves midpoint as zoom anchor |
| Scroll Wheel Zoom | Mouse wheel zooms in/out centred on cursor | `infinite-canvas.tsx` | ✅ Working | `onWheel` handler | Clamps to MIN_ZOOM/MAX_ZOOM |
| Shift+Scroll Pan | Scroll wheel pans horizontally when Shift held | `infinite-canvas.tsx` | ✅ Working | `onWheel` handler | Also pans when `spacebarPressed` |
| Drag-Select Rectangle | Drag canvas background to rubber-band select multiple notes | `infinite-canvas.tsx` | ✅ Working | `selectNotes` action | Teal selection rect overlay |
| Multi-Note Drag Move | Drag selected notes together | `infinite-canvas.tsx` | ✅ Working | `moveNotesBy`, `commitNotes` | Hold Shift/Ctrl to multi-select first |
| Snap to Grid | Notes snap to grid on drag release | `commitNotes` in store + settings | ✅ Working | `snapToGrid` setting, `gridSize` | Rounds to nearest `gridSize` pixels |
| Grid Background | Dot/line grid overlay on canvas | `infinite-canvas.tsx` inline style | ✅ Working | `showGrid` setting | CSS `backgroundImage` grid pattern |
| Connection Layer | SVG lines drawn between notes | `components/canvas/connection-layer.tsx` | ✅ Working | Note positions, connection data | Only renders visible endpoints |
| Connection Types | 5 relationship types with distinct colours/dashes | `lib/constants.ts` `CONNECTION_STYLES` | ✅ Working | `ConnectionType` enum | Related, Supports, Causes, References, Contradicts |
| Group Bounds | Dashed coloured border around notes in the same group | `infinite-canvas.tsx` (groupBounds memo) | ✅ Working | `NoteGroup`, `groupId` on Note | Group label shown in corner |
| Minimap | Small overview SVG showing all note positions and viewport rect | `components/canvas/minimap.tsx` | ✅ Working | Note positions, viewport | Display only — not interactive/clickable |
| Fit Canvas | Calculates zoom/pan to fit all notes in view | `fitCanvas` in `infinite-canvas.tsx` | ✅ Working | Note positions, container size | Button in canvas toolbar |
| Reset View | Resets viewport to default position/zoom | Canvas toolbar | ✅ Working | `setViewport` action | Resets to `{ x: 420, y: 260, zoom: 1 }` |
| Double-click Create Note | Double-clicking canvas background creates a note at that world position | `onDoubleClick` in infinite-canvas | ✅ Working | `createNote` action | Only fires if click target is canvas itself |

---

## Note Management

| Feature Name | Purpose | Location | Status | Dependencies | Notes / Example Usage |
|---|---|---|---|---|---|
| Create Note | Adds a new note with default title and content | `store/workspace-store.ts` → `createNote` | ✅ Working | `saveNote` DB function | 5 creation entry points |
| Edit Title (Inspector) | Edit title in Note Inspector text field | `components/note-inspector.tsx` | ✅ Working | `updateNote` action | Auto-saved on every keystroke |
| Edit Title (on card) | Inline title edit directly on the note card | `components/canvas/note-card.tsx` | ✅ Working | `onTitleChange` callback | Stops pointer propagation to prevent drag |
| Edit Content (Markdown) | Markdown textarea in Note Inspector | `components/markdown/markdown-editor.tsx` | ✅ Working | `updateNote` action | Auto-saved on every keystroke |
| Change Note Colour | Click colour swatches in inspector | `components/note-inspector.tsx` | ✅ Working | `updateNote` action | 8 preset colours |
| Add Tags | Comma-separated tag input in inspector | `components/note-inspector.tsx` | ✅ Working | `updateNote`, `splitTags` util | Tags appear on card and in sidebar |
| Assign Group | Dropdown to assign a note to a group | `components/note-inspector.tsx` | ✅ Working | `updateNote`, `groups` in store | Draws group bounds on canvas |
| Create Group | Type name + click folder+ icon in inspector | `components/note-inspector.tsx` | ✅ Working | `addGroup` action | Uses note's current colour |
| Delete Note | Select + Delete/Backspace key | `hooks/use-keyboard-shortcuts.ts` | ✅ Working | `deleteSelectedNotes` action | Also removes incident connections |
| Delete Note (UI button) | Dedicated delete button in inspector or canvas | — | ❌ Broken/Missing | — | **No UI delete button exists.** Keyboard-only. |
| Select Note | Click note on canvas or sidebar list | `selectNote` action | ✅ Working | `selectedNoteIds` state | Opens Note Inspector |
| Multi-Select Notes | Shift/Ctrl+click or drag-select | `selectNote` (toggle mode), drag-select | ✅ Working | `selectedNoteIds` state | All selected notes can be moved or deleted together |
| Undo | Reverts last workspace change | `undo` action + toolbar button | ✅ Working | `historyPast` module-level array | Up to 40 history states |
| Redo | Reapplies undone change | `redo` action + toolbar button | ✅ Working | `historyFuture` array | |
| Undo/Redo Keyboard | `Ctrl+Z` / `Ctrl+Y` global shortcuts | — | ❌ Broken/Missing | — | **No keyboard shortcut for Undo/Redo.** Toolbar only. |

---

## Connections

| Feature Name | Purpose | Location | Status | Dependencies | Notes / Example Usage |
|---|---|---|---|---|---|
| Add Connection (canvas tool) | Connect two notes by clicking them with the connect tool | `infinite-canvas.tsx` → `onNotePointerDown` | ✅ Working | `addConnection` action | Prevents self-connection, prevents duplicate connections |
| Add Connection (card button) | Cable icon on note card header enters connect mode | `note-card.tsx` → `onConnect` callback | ✅ Working | `setConnectSource` action | Same flow as connect tool |
| Add Connection (inspector form) | Dropdown target + type + label form in inspector | `note-inspector.tsx` | ✅ Working | `addConnection` action | Supports all 5 relationship types |
| Edit Connection Label | Inline edit in the inspector's connected notes list | `note-inspector.tsx` | ✅ Working | `updateConnection` action | |
| Edit Connection Type | Dropdown in the inspector's connected notes list | `note-inspector.tsx` | ✅ Working | `updateConnection` action | |
| Delete Connection | Trash icon on each connection row in inspector | `note-inspector.tsx` | ✅ Working | `deleteConnection` action | |
| Connection Count Badge | Shows the number of connections on each note card | `note-card.tsx` | ✅ Working | `connectionCounts` computed memo | GitBranch icon + count |
| Animated Connections | "Supports" type connections animate the stroke | `graph-view.tsx` + `connection-layer.tsx` | 🔲 Untested | `animated` edge prop (graph), SVG dash animation (canvas) | Visually distinct from others |

---

## Note Inspector Panel

| Feature Name | Purpose | Location | Status | Dependencies | Notes / Example Usage |
|---|---|---|---|---|---|
| Inspector Open/Close | Opens when a note is selected, closes with X button | `app-shell.tsx` `AnimatePresence` + `NoteInspector` | ✅ Working | `activeNoteId` state | Animated slide-in from right |
| Inspector Resize | Drag the left edge to resize the panel width | `beginResize` in `note-inspector.tsx` | ✅ Working | `localStorage` persists width | Width clamped 320–700px |
| Inspector Hidden When Other Panels Open | Inspector hides when Export or Settings panel is open | `app-shell.tsx` conditional render | ✅ Working | `activePanel` state | |

---

## Sidebar

| Feature Name | Purpose | Location | Status | Dependencies | Notes / Example Usage |
|---|---|---|---|---|---|
| Notes Panel | Scrollable list of all notes; filters by search query | `sidebar.tsx` | ✅ Working | `getFilteredNotes` action | Click a note to select it on canvas |
| Tags Panel | Sorted list of all tags with note counts | `sidebar.tsx` | ✅ Working | `tagCounts` computed in sidebar | Clicking a tag sets it as search query |
| Graph Panel (nav) | Nav button that switches to Graph View | `sidebar.tsx` | ✅ Working | `setActivePanel("graph")` | |
| Export Panel (nav) | Nav button that opens the Export overlay panel | `sidebar.tsx` | ✅ Working | `setActivePanel("export")` | |
| Settings Panel (nav) | Nav button that opens the Settings overlay panel | `sidebar.tsx` | ✅ Working | `setActivePanel("settings")` | |
| Templates Section | Buttons to insert pre-built template workspaces | `sidebar.tsx` | ✅ Working | `applyTemplate` action | Always visible below Notes/Tags lists |
| Collapse Sidebar | Toggle sidebar to icon-only narrow mode | `sidebar.tsx` + `app-shell.tsx` | ✅ Working | `sidebarCollapsed` state | Only on desktop (lg breakpoint) |
| Mobile Sidebar | Sidebar slides in as overlay on mobile | `sidebar.tsx` + `app-shell.tsx` | ✅ Working | `sidebarMobileOpen` state | Backdrop overlay dismisses it |
| Note Count Display | Shows total note count below app name | `sidebar.tsx` | ✅ Working | `notes.length` | |

---

## Top Bar

| Feature Name | Purpose | Location | Status | Dependencies | Notes / Example Usage |
|---|---|---|---|---|---|
| Global Search | Search notes by title, content, and tags | `top-bar.tsx` + `infinite-canvas.tsx` | ✅ Working | Fuse.js fuzzy search | Highlights matches on canvas |
| Theme Toggle Button | Switches Light/Dark mode | `top-bar.tsx` | ✅ Working | `updateSettings`, `useTheme` hook | Overrides system preference |
| Export Button | Opens Export Panel | `top-bar.tsx` | ✅ Working | `setActivePanel("export")` | |
| Settings Button | Opens Settings Panel | `top-bar.tsx` | ✅ Working | `setActivePanel("settings")` | |
| Mobile Menu Button | Opens sidebar on mobile | `top-bar.tsx` | ✅ Working | `onOpenSidebar` callback | Hidden on desktop |

---

## Canvas Toolbar

| Button | Purpose | Status | Notes |
|---|---|---|---|
| Select tool | Default pointer tool; drag to move notes | ✅ Working | |
| Pan tool | Hold and drag to pan viewport | ✅ Working | Same as Space+drag |
| Connect tool | Click-to-connect notes mode | ✅ Working | Click source then target |
| Create Note button | New note at canvas centre | ✅ Working | Same as N key |
| Undo button | Step back in history | ✅ Working | Greyed out when no history |
| Redo button | Step forward in history | ✅ Working | Greyed out when no future |
| Zoom Out button | Decreases zoom by factor | ✅ Working | |
| Zoom % display | Shows current zoom as percentage | ✅ Working | Read-only text |
| Zoom In button | Increases zoom by factor | ✅ Working | |
| Fit Canvas button | Zooms to fit all notes | ✅ Working | |
| Reset View button | Returns viewport to origin | ✅ Working | ⚠️ Both "Fit canvas" and "Reset view" use `RotateCcw` icon — visually identical, confusing |

---

## Markdown Editor

| Feature Name | Purpose | Status | Notes |
|---|---|---|---|
| Textarea raw edit | Type raw Markdown | ✅ Working | spellcheck enabled |
| Preview pane | Rendered Markdown via react-markdown + remark-gfm | ✅ Working | Links open in new tab |
| Split mode | Side-by-side edit + preview | ✅ Working | Stacks vertically on mobile |
| Heading button | Inserts `## Heading` block | ✅ Working | |
| Bold button | Wraps selection in `**` | ✅ Working | |
| Italic button | Wraps selection in `*` | ✅ Working | |
| Inline code button | Wraps selection in `` ` `` | ✅ Working | |
| Quote button | Inserts `> Quote` block | ✅ Working | |
| List button | Inserts `- Item` list | ✅ Working | |
| Checklist button | Inserts `- [ ] Task` checklist | ✅ Working | |
| Table button | Inserts Markdown table template | ✅ Working | |
| Link button | Wraps selection in `[text](url)` | ✅ Working | |
| Image button | Inserts `![alt](url)` image | ✅ Working | |

---

## Graph View

| Feature Name | Purpose | Location | Status | Dependencies | Notes |
|---|---|---|---|---|---|
| Force Layout | D3-force simulation to compute node positions | `lib/graph/layout.ts` | ✅ Working | d3-force | 180 simulation ticks, deterministic |
| Cluster by tag/group | Notes with same first tag or group are pulled together | `computeForceLayout` | ✅ Working | `note.tags[0]` or `note.groupId` | |
| ReactFlow Rendering | Renders nodes and edges via @xyflow/react | `components/graph/graph-view.tsx` | ✅ Working | @xyflow/react v12 | |
| Edge Styles | Different stroke colours/dashes per relationship type | `graph-view.tsx` | ✅ Working | `CONNECTION_STYLES` constants | |
| Node Click → Select | Clicking a node selects it and switches to Notes panel | `graph-view.tsx` `onNodeClick` | ✅ Working | `selectNote`, `setActivePanel` | |
| Search Highlight in Graph | Matching nodes glow when search query is active | `graph-view.tsx` | ✅ Working | `searchQuery` from store | |
| ReactFlow Controls | Zoom in/out/fit buttons | `graph-view.tsx` | ✅ Working | ReactFlow `Controls` component | Bottom-left |
| ReactFlow Minimap | Overview map of graph | `graph-view.tsx` | ✅ Working | ReactFlow `MiniMap` component | Pannable and zoomable |
| Node Drag | Nodes cannot be dragged (layout is read-only) | `graph-view.tsx` | ✅ Working (intentional) | `nodesDraggable={false}` | |

---

## Export & Import

| Feature Name | Purpose | Location | Status | Dependencies | Notes |
|---|---|---|---|---|---|
| Export JSON | Downloads full workspace as `.json` | `lib/export/exporter.ts` | ✅ Working | `downloadBlob` util | Includes metadata (exportedAt, version) |
| Export Markdown ZIP | Downloads `.zip` with one `.md` per note + connections index | `exporter.ts` + JSZip | ✅ Working | JSZip | Includes `workspace.json` inside zip |
| Export PNG | DOM capture of canvas → `.png` | `exporter.ts` + html-to-image | ⚠️ Partially Working | `html-to-image`, `toPng` | May miss notes outside the DOM snapshot; relies on CSS variable `--app-bg` |
| Export SVG | DOM capture of canvas → `.svg` | `exporter.ts` + html-to-image | ⚠️ Partially Working | `html-to-image`, `toSvg` | Same limitations as PNG; fonts/images may not embed |
| Import JSON | Replace workspace from `.json` file | `export-panel.tsx` → `importJson` | ✅ Working | `replaceWorkspace` action | Validates file structure; error shown on invalid |
| Storage Estimate Bar | Shows IndexedDB usage vs quota | `export-panel.tsx` | ✅ Working | `navigator.storage.estimate()` | Falls back to "Unavailable" if not supported |

---

## Settings

| Setting | Status | Notes |
|---|---|---|
| Theme (System/Light/Dark) | ✅ Working | Persisted in IndexedDB settings table |
| Grid overlay toggle | ✅ Working | CSS backgroundImage on canvas |
| Snap to grid toggle | ✅ Working | Applied on `commitNotes` |
| Grid size slider | ✅ Working | 16–72px, step 4 |
| Reduced motion toggle | ✅ Working | Persisted, but CSS/motion implementation not wired beyond persistence |
| WebRTC sync toggle | ⚠️ Partially Working | The setting is persisted. The `PeerSyncSession` class exists in `lib/sync/webrtc.ts` but is **never instantiated or used** by any component. Toggling this checkbox has no functional effect. |

---

## Data Persistence & Storage

| Feature Name | Purpose | Status | Notes |
|---|---|---|---|
| IndexedDB persistence | All notes, connections, groups, settings stored in Dexie | ✅ Working | Database name: `InfiniteCanvasNotes` |
| In-memory fallback | App works with no IndexedDB (e.g. private browsing restrictions) | ✅ Working | `memoryWorkspace` fallback in `db.ts` |
| Seeding starter workspace | Empty DB gets pre-populated with Mind Map template | ✅ Working | `seedIfNeeded()` in `db.ts` |
| Hydration on first load | Store loads from DB once on mount | ✅ Working | `usePersistedWorkspace` hook |
| Incremental saves | Notes saved individually on create/edit; batch-saved after drag | ✅ Working | `saveNote`, `saveNotes`, `commitNotes` |
| Cascade delete connections | Deleting a note also deletes its connections in DB | ✅ Working | Transaction in `deleteNotes()` |
| Settings persistence | Settings written to DB on every change | ✅ Working | `saveSettings()` |
| Editor width persistence | Note Inspector panel width saved to `localStorage` | ✅ Working | Key: `infinite-canvas-notes:editor-width` |

---

## PWA & Offline

| Feature Name | Purpose | Status | Notes |
|---|---|---|---|
| Web App Manifest | Makes app installable as PWA | ✅ Working | `/manifest.webmanifest` |
| Service Worker | Caches app shell and Next.js static assets | ⚠️ Partially Working | **Only registered in production builds** (`NODE_ENV=production`). Dev server has no SW. |
| Offline workspace access | Workspace loads from IndexedDB when offline | ✅ Working | Runtime data is in IndexedDB, not cache |
| Offline first load | App shell served from cache when offline | ⚠️ Partially Working | Only works after at least one production load with SW active |

---

## Sync

| Feature Name | Purpose | Status | Notes |
|---|---|---|---|
| WebRTC Peer Sync | Manual offer/answer P2P data channel to exchange workspace snapshots | ❌ Broken/Missing | Class is implemented in `lib/sync/webrtc.ts` but **no UI** for offer/answer exchange exists. The settings toggle does nothing. `NEXT_PUBLIC_ENABLE_PEER_SYNC` env var is only referenced in documentation, not in code. |

---

## Testing

| Test Suite | What it covers | Result |
|---|---|---|
| `exporter.test.ts` (unit) | JSON serialisation, Markdown ZIP entry paths | ✅ 2/2 Passed |
| `graph-layout.test.ts` (unit) | Force layout produces stable node count | ✅ 1/1 Passed |
| `workspace-store.test.ts` (unit) | createNote, updateNote, deleteNote, connections | ✅ 4/4 Passed |
| `markdown-editor.test.tsx` (integration) | Textarea renders and onChange fires | ✅ 1/1 Passed |
| `app.spec.ts` (E2E Playwright) | Create, edit, search, graph view flow | ❌ 2/2 Failed — Strict-mode selector bug: `getByText("Infinite Canvas Notes")` matches both `<h1>` and `<title>` |
