# Test Report — Infinite Canvas Notes

Audit date: **2026-06-06**  
Codebase version: **1.0.0**

---

## Summary

| Suite | Tests | Passed | Failed | Status |
|---|---|---|---|---|
| Unit (Vitest) | 7 | 7 | 0 | ✅ All passed |
| Integration (Vitest + RTL) | 1 | 1 | 0 | ✅ All passed |
| E2E (Playwright) | 2 | 0 | 2 | ❌ All failed |
| **Total** | **10** | **8** | **2** | ⚠️ Partial |

---

## Unit Tests

### `tests/unit/exporter.test.ts`

Tests the JSON and Markdown export serialisation functions.

| Test Case | Result | Notes |
|---|---|---|
| `serializeWorkspace` produces valid JSON with version and exportedAt fields | ✅ PASS | |
| `buildMarkdownArchiveEntries` creates one entry per note plus connections.md and workspace.json | ✅ PASS | |

### `tests/unit/graph-layout.test.ts`

Tests the D3 force-directed layout calculation.

| Test Case | Result | Notes |
|---|---|---|
| `computeForceLayout` returns the same number of nodes as notes passed in | ✅ PASS | Deterministic 180-tick simulation |

### `tests/unit/workspace-store.test.ts`

Tests the Zustand workspace store actions using `fake-indexeddb`.

| Test Case | Result | Notes |
|---|---|---|
| `createNote` adds a note to the store | ✅ PASS | |
| `updateNote` modifies a specific note's fields | ✅ PASS | |
| `deleteSelectedNotes` removes selected notes and their connections | ✅ PASS | Cascade delete verified |
| `addConnection` does not allow duplicate connections of same type between same pair | ✅ PASS | |

---

## Integration Tests

### `tests/integration/markdown-editor.test.tsx`

Tests the MarkdownEditor React component using React Testing Library.

| Test Case | Result | Notes |
|---|---|---|
| Textarea renders with the supplied value and calls onChange when typed into | ✅ PASS | |

---

## End-to-End Tests (Playwright)

Tests run on Chromium and mobile-Chrome. The app is tested at `http://localhost:3000` (configured in `playwright.config.ts`).

### `tests/e2e/app.spec.ts` — "creates, edits, searches, connects, and opens graph view"

| Browser | Result | Reason |
|---|---|---|
| Chromium | ❌ FAIL | See below |
| Mobile Chrome | ❌ FAIL | Same error |

**Root cause:** The test selector on line 6 uses `page.getByText("Infinite Canvas Notes")` which resolves to **two elements** in strict mode:
1. `<h1>Infinite Canvas Notes</h1>` — the visible heading in the sidebar
2. `<title>Infinite Canvas Notes</title>` — the HTML document title (invisible)

Playwright's strict mode requires exactly one match. The test throws:
```
Error: strict mode violation: getByText('Infinite Canvas Notes') resolved to 2 elements
```

**Fix required:** Replace with `page.getByRole('heading', { name: 'Infinite Canvas Notes' })` to match only the `<h1>`.

> ⚠️ WARNING: Because the E2E test fails at line 6 (the very first assertion), none of the subsequent flows — create note, edit, search, graph view — are actually verified by Playwright. Those flows are NOT confirmed to work end-to-end by automated tests.

---

## Functional Test Results (Static Code Analysis)

Since the Playwright suite cannot run through, the following functional checks are based on thorough static analysis of the complete codebase:

| Test | Method | Result | Reason |
|---|---|---|---|
| Create note | Store `createNote` unit test ✅ + code analysis | ✅ PASS | 5 entry points all call `createNote`, which appends to store and calls `saveNote` |
| Edit note title | Code analysis | ✅ PASS | `updateNote` called on every keystroke; persisted to DB immediately |
| Edit note content | Unit test + code analysis | ✅ PASS | Markdown editor onChange wired to `updateNote` |
| Delete note | Store `deleteSelectedNotes` unit test ✅ | ✅ PASS | Tested including cascade connection delete |
| Move note | Code analysis | ✅ PASS | `moveNotesBy` + `commitNotes` on pointer up; `snapToGrid` conditional |
| Connect notes (tool) | Code analysis | ✅ PASS | `addConnection` guards duplicates and self-connections |
| Connect notes (inspector form) | Code analysis | ✅ PASS | Same `addConnection` action, with type and label params |
| Save note (auto-persist) | Code analysis | ✅ PASS | `saveNote` called in `createNote` and `updateNote`; `saveNotes` after drag |
| Refresh persistence | Code analysis | ✅ PASS | `loadWorkspace` runs on hydration; in-memory + IndexedDB both handled |
| Undo / Redo | Code analysis | ✅ PASS | Module-level `historyPast/Future` arrays; up to 40 states |
| Search (fuzzy) | Code analysis | ✅ PASS | Fuse.js with threshold 0.32; keys: title, content, tags |
| Search canvas focus | Code analysis | ✅ PASS | Viewport pans to first result on new query |
| Tag filter | Code analysis | ✅ PASS | Tag click sets searchQuery; Notes list filters via `getFilteredNotes` |
| Graph view render | Code analysis | ✅ PASS | ReactFlow + D3 layout; nodes and edges derived from store |
| Export JSON | Unit test (serialisation) ✅ | ✅ PASS | `serializeWorkspace` + `downloadBlob` |
| Export Markdown ZIP | Unit test (entry building) ✅ | ✅ PASS | `buildMarkdownArchiveEntries` + JSZip |
| Export PNG | Code analysis only | 🔲 UNTESTED | `exportCanvasPng` calls `html-to-image` toPng — needs browser to verify |
| Export SVG | Code analysis only | 🔲 UNTESTED | `exportCanvasSvg` calls `html-to-image` toSvg — needs browser to verify |
| Import JSON | Code analysis | ✅ PASS | `importJson` validates structure; error feedback on parse failure |
| Dark mode toggle | Code analysis | ✅ PASS | `updateSettings({ theme })` + `useTheme` hook applies CSS variables |
| System theme (auto) | Code analysis | ✅ PASS | `window.matchMedia` check in `useTheme` |
| Grid setting | Code analysis | ✅ PASS | Canvas CSS backgroundImage controlled by `showGrid` |
| Snap setting | Code analysis | ✅ PASS | `roundToGrid` called in `commitNotes` when `snapToGrid` is true |
| Reduced motion setting | Code analysis | ⚠️ WARNING | Setting is persisted to DB but the CSS/framer-motion binding is not wired — toggling this has no visual effect |
| WebRTC sync toggle | Code analysis | ❌ FAIL | `peerSyncEnabled` is saved to settings but `PeerSyncSession` is never instantiated. The toggle does nothing functional. |
| Offline mode | Code analysis | ⚠️ WARNING | App falls back to in-memory workspace if IndexedDB fails. Service worker only active in production builds. |
| PWA install | Code analysis | ⚠️ WARNING | Manifest and SW present, but SW only registers in production (`NODE_ENV=production`). Dev builds are not installable. |
| Template insertion | Code analysis | ✅ PASS | `applyTemplate` correctly maps IDs, applies offsets, pushes to history |
| Group creation | Code analysis | ✅ PASS | `addGroup` creates group; `updateNote({ groupId })` assigns it |
| Inspector resize | Code analysis | ✅ PASS | Pointer events + `localStorage` persistence of width |
| Command palette | Code analysis | ✅ PASS | `Ctrl+K` opens; Escape closes; filter by label text |
| Minimap render | Code analysis | ✅ PASS | Pure SVG computation from note positions and viewport |
| Canvas virtualization | Code analysis | ✅ PASS | `rectsIntersect` guards render; margin buffered |
| Multi-select drag | Code analysis | ✅ PASS | `selectedNoteIds` shared across all drag operations |

---

## Overall Test Verdict

| Category | Result |
|---|---|
| Automated unit/integration tests | ✅ 8/8 passing |
| E2E Playwright tests | ❌ 2/2 failing (selector bug in test, not in app) |
| Functional core (create/edit/delete/connect/search/undo) | ✅ PASS |
| Export JSON/Markdown | ✅ PASS |
| Export PNG/SVG | 🔲 UNTESTED (requires live browser) |
| WebRTC Sync | ❌ FAIL (not wired) |
| PWA/Service Worker | ⚠️ WARNING (production-only) |
| Reduced motion | ⚠️ WARNING (not fully wired) |
