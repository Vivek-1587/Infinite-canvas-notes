# Bug Report — Infinite Canvas Notes

Audit date: **2026-06-06**  
Codebase version: **1.0.0**

Severity levels:
- 🔴 **Critical** — Feature is completely non-functional or data loss is possible.
- 🟠 **High** — A core workflow is impaired or a clearly wrong behaviour exists.
- 🟡 **Medium** — A confusing or incomplete experience that affects usability.
- 🟢 **Low** — Minor visual inconsistency, missing polish, or dead-code smell.

---

## BUG-001 — E2E Playwright test fails due to strict-mode selector ambiguity

**Severity:** 🟠 High  
**Location:** `tests/e2e/app.spec.ts`, line 6  
**Status:** Confirmed Bug  

**Description:**  
The E2E test uses `page.getByText("Infinite Canvas Notes")` which matches both the visible `<h1>` sidebar heading and the invisible `<title>` element. Playwright's strict mode requires exactly one match, so both test cases (Chromium and mobile-Chrome) fail at the very first assertion, meaning none of the create/edit/search/graph-view flows are exercised by CI.

**Evidence:**
```
Error: strict mode violation: getByText('Infinite Canvas Notes') resolved to 2 elements:
  1) <h1 class="truncate text-base font-bold">Infinite Canvas Notes</h1>
  2) <title>Infinite Canvas Notes</title>
```

**Fix:**
```typescript
// app.spec.ts line 6 — replace:
await expect(page.getByText("Infinite Canvas Notes")).toBeVisible();
// with:
await expect(page.getByRole("heading", { name: "Infinite Canvas Notes" })).toBeVisible();
```

---

## BUG-002 — No UI button to delete a note; keyboard-only deletion is undiscoverable

**Severity:** 🟠 High  
**Location:** `components/note-inspector.tsx`, `components/canvas/note-card.tsx`  
**Status:** Missing Feature / UX Bug  

**Description:**  
There is no delete button on the Note Inspector panel or on the note card itself. The only way to delete notes is by selecting them and pressing the `Delete` or `Backspace` key. This is not documented anywhere in the UI (no hint, tooltip, or footer text), making it a completely undiscoverable action for new users.

**Impact:** New users have no obvious way to remove notes. This is especially problematic because there is no right-click context menu either.

**Recommendation:** Add a Trash2 icon button to the Note Inspector header (next to the X close button) that calls `deleteSelectedNotes`.

---

## BUG-003 — Undo/Redo keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`) are not bound

**Severity:** 🟠 High  
**Location:** `hooks/use-keyboard-shortcuts.ts`  
**Status:** Missing Handler  

**Description:**  
The Undo and Redo actions are implemented in the store and accessible via the canvas toolbar buttons. However, `useKeyboardShortcuts` does not bind `Ctrl+Z` or `Ctrl+Y`/`Ctrl+Shift+Z`. Users who instinctively press `Ctrl+Z` expecting undo will get the browser's native undo inside any focused textarea (undoing the last typed character), not the workspace-level undo.

**Evidence:** `hooks/use-keyboard-shortcuts.ts` contains handlers for `Ctrl+K`, `Ctrl+F`, `Ctrl+S`, `N`, `Delete`, and `Backspace` — but not `Ctrl+Z` or `Ctrl+Y`.

**Fix:** Add the following to `useKeyboardShortcuts`:
```typescript
if (modifier && (key === "z")) {
  event.preventDefault();
  if (event.shiftKey) redo(); else undo();
}
```

---

## BUG-004 — WebRTC Sync toggle has no functional effect

**Severity:** 🟠 High  
**Location:** `components/settings-panel.tsx`, `lib/sync/webrtc.ts`  
**Status:** Dead Code / Incomplete Feature  

**Description:**  
The Settings panel shows a "WebRTC sync" checkbox that persists `peerSyncEnabled` to IndexedDB. The `PeerSyncSession` class is fully implemented in `lib/sync/webrtc.ts` and can create offers, accept answers, and exchange workspace snapshots. However:
- No component ever imports or instantiates `PeerSyncSession`.
- There is no offer/answer text exchange UI.
- The `NEXT_PUBLIC_ENABLE_PEER_SYNC` environment variable mentioned in `ARCHITECTURE.md` is **not read** anywhere in the runtime code.

**Impact:** The checkbox misleads users into believing sync is active when it has zero effect. There is no way to actually use the WebRTC sync feature.

**Recommendation:** Either remove the checkbox until the UI is implemented, or add a note labelling it "Coming soon".

---

## BUG-005 — "Fit canvas" and "Reset view" toolbar buttons use identical icons

**Severity:** 🟡 Medium  
**Location:** `components/canvas/canvas-toolbar.tsx`, lines 88–93  
**Status:** UI Inconsistency  

**Description:**  
Both the "Fit canvas" button (Maximize2 icon) and the "Reset view" button (RotateCcw icon) use similar-looking icons. However, looking at the code more carefully, "Fit canvas" uses `Maximize2` and "Reset view" uses `RotateCcw`. The problem is that the "Reset view" icon (`RotateCcw`) is **also** used for the "Undo" button directly above it. This means two adjacent groups of buttons share the same icon for semantically different purposes.

**Evidence:**
```tsx
// Line 73: Undo button
<RotateCcw size={17} />
// Line 91: Reset view button  
<RotateCcw size={17} />
```

**Impact:** Users may confuse "Undo" and "Reset view" which are very different actions.

**Recommendation:** Use `Home` or `Crosshair` icon for "Reset view" to visually distinguish it from Undo.

---

## BUG-006 — "Reduced motion" setting is persisted but not applied to CSS or animations

**Severity:** 🟡 Medium  
**Location:** `components/settings-panel.tsx`, `lib/types.ts`  
**Status:** Incomplete Implementation  

**Description:**  
`settings.reducedMotion` is stored in IndexedDB and the checkbox toggles it correctly. However, there is no code that:
- Sets a CSS class or `data-reduced-motion` attribute on `<html>` or `<body>`.
- Passes `reducedMotion` to Framer Motion's `motion` components.
- Disables CSS transitions.

The `useTheme` hook (which applies other settings) does not handle `reducedMotion`.

**Impact:** Users with motion sensitivity who enable this setting will see no change in animation behaviour.

**Recommendation:** In `hooks/use-theme.ts`, add:
```typescript
document.documentElement.setAttribute("data-reduced-motion", settings.reducedMotion ? "true" : "false");
```
Then in global CSS, add `[data-reduced-motion="true"] * { transition: none !important; animation: none !important; }`.

---

## BUG-007 — Service Worker is never active during development; offline mode untestable locally

**Severity:** 🟡 Medium  
**Location:** `app/service-worker-register.tsx`, line 10  
**Status:** Known Limitation / Environment Bug  

**Description:**  
The service worker registration is gated behind `process.env.NODE_ENV !== "production"`. This means developers running `npm run dev` will never have the service worker active, so offline PWA behaviour cannot be verified during development without running a production build.

```typescript
if (!enabled || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
  return;
}
```

**Impact:** Any offline regression would only be caught in a production build. The `sw.js` is technically stale since it uses a hardcoded `CACHE_VERSION = "infinite-canvas-notes-v1"` which is not tied to any build hash — deployments won't bust the cache automatically.

**Recommendation:** Consider using `next-pwa` or a build-time cache manifest with a content hash to prevent stale caches on new deployments.

---

## BUG-008 — PNG/SVG exports miss notes that are off-screen

**Severity:** 🟡 Medium  
**Location:** `lib/export/exporter.ts`, `exportCanvasPng` / `exportCanvasSvg`  
**Status:** Structural Limitation  

**Description:**  
`exportCanvasPng` and `exportCanvasSvg` target the `[data-canvas-export-root]` DOM element, which is a `div` that contains all notes (including virtualized ones rendered off-screen). However, `html-to-image` captures what is **rendered in the DOM at capture time**. Because the canvas uses virtualization, notes outside the visible viewport may not be present in the DOM at all at the moment of capture.

Additionally, `getExportBounds` in `exporter.ts` is computed but **never passed** to `toPng`/`toSvg` — the export does not clip or resize to fit all notes.

**Impact:** For large workspaces, exported images will show only the currently visible portion of the canvas, not the complete workspace.

**Recommendation:** Before capturing, temporarily disable virtualization (set a flag to render all notes), or use `getExportBounds` to set explicit `width`/`height` on the export call.

---

## BUG-009 — Tag filter via sidebar does not deactivate when switching panels

**Severity:** 🟢 Low  
**Location:** `components/sidebar.tsx`, line 157–159  
**Status:** UX Inconsistency  

**Description:**  
Clicking a tag in the Tags panel calls `setSearchQuery(tag)` and then `onCloseMobile()`. This sets the global `searchQuery` to the tag text. If the user switches to a different sidebar panel (e.g. Notes), the search query remains active, which can be confusing — they may not realise the canvas is still filtered.

**Impact:** Low — the search bar shows the active query so a user can see it, but there's no visual indicator in the Tags panel that a filter is active.

**Recommendation:** Consider resetting the search query when switching panels, or adding an "active filter" badge.

---

## BUG-010 — Groups are never deleted even when all member notes are deleted

**Severity:** 🟢 Low  
**Location:** `store/workspace-store.ts` → `deleteSelectedNotes`, `lib/db.ts`  
**Status:** Missing Cleanup Logic  

**Description:**  
When notes are deleted, their `groupId` references are removed. However, empty groups (groups with zero member notes) are **never deleted**. The `groups` array in the store grows indefinitely. These orphaned groups:
- Still appear in the "Group" dropdown in the Note Inspector.
- Still exist in the IndexedDB `groups` table.
- Are included in JSON exports.

**Evidence:** `deleteSelectedNotes` in `workspace-store.ts` removes notes and their connections but never prunes empty groups.

**Impact:** Over time, workspaces accumulate phantom groups that can't be removed.

**Recommendation:** After deleting notes, check if any group now has zero members and delete those groups from both the store and IndexedDB.

---

## BUG-011 — History (undo/redo) state is module-level and shared across component lifecycle

**Severity:** 🟢 Low  
**Location:** `store/workspace-store.ts`, lines 82–83  
**Status:** Design Risk  

**Description:**  
`historyPast` and `historyFuture` are declared as `let` variables at the **module level** outside the Zustand store. This means the undo history is not encapsulated within the store instance. In testing (`resetWorkspaceStoreForTests`), the history arrays are explicitly reset. However, in a hypothetical multi-store or server-side scenario, history would leak across instances.

**Impact:** Low risk in normal browser usage (single store), but it's a code smell and a testing pitfall if not carefully managed.

**Recommendation:** Move history into the Zustand store state object, or use a `ref`-based approach within the store creator function.

---

## BUG-012 — Command palette has no keyboard navigation (arrow keys)

**Severity:** 🟢 Low  
**Location:** `components/command-palette.tsx`  
**Status:** Missing Feature / UX Gap  

**Description:**  
The Command Palette opens with `Ctrl+K`, filters actions as you type, and closes with `Escape`. However, it does not support keyboard navigation with `ArrowUp`/`ArrowDown` keys to highlight commands, or `Enter` to execute the highlighted command. Users must click with the mouse.

**Impact:** Power users who open the palette with a keyboard shortcut expect full keyboard navigation. Clicking breaks the "hands-on-keyboard" flow.

**Recommendation:** Add `ArrowUp`/`ArrowDown` focus management and `Enter` handler to the palette's `useEffect`.

---

## BUG-013 — Minimap is display-only and not interactive

**Severity:** 🟢 Low  
**Location:** `components/canvas/minimap.tsx`  
**Status:** Missing Feature  

**Description:**  
The custom canvas minimap (bottom-right SVG) has `pointer-events-none` applied to its container div, making it completely non-interactive. Users cannot click on the minimap to navigate to a region or drag the viewport indicator.

By contrast, the **Graph View** minimap (from React Flow) IS interactive (pannable and zoomable).

**Impact:** Minor — the canvas minimap is decorative only.

**Recommendation:** Remove `pointer-events-none` and add `onClick` to map click coordinates back to world coordinates and update the viewport.

---

## BUG-014 — `useTheme` hook does not respond to `reducedMotion` setting

**Severity:** 🟢 Low  
**Location:** `hooks/use-theme.ts`  
**Status:** Incomplete (see also BUG-006)  

**Description:**  
The `useTheme` hook reads `settings.theme` to apply dark/light class on `<html>`, but it does not read `settings.reducedMotion` or `settings.gridSize`. These are consumed directly by components (`settings-panel.tsx`, `infinite-canvas.tsx`) but none of them are centrally managed from a single hook.

**Recommendation:** Centralise all setting-to-DOM-side-effects in `useTheme`.

---

## Dead Code / Unused Items

| Item | Location | Notes |
|---|---|---|
| `getExportBounds()` function | `lib/export/exporter.ts` lines 122–138 | Exported and computed but never used by any export call |
| `PeerSyncSession` class | `lib/sync/webrtc.ts` | Fully implemented, never imported or instantiated |
| `NEXT_PUBLIC_ENABLE_PEER_SYNC` env var | `.env.example` | Referenced in docs but not read by any runtime code |
| `formatBytes` utility | `lib/utils.ts` (inferred) | Used in export panel storage display — not dead, but worth confirming |
