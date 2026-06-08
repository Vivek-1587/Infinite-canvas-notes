# Architecture

## Folder Structure

- `app/`: Next.js App Router entry points, metadata, global CSS, and service worker registration.
- `components/`: Product UI, canvas renderer, graph view, Markdown editor, panels, and controls.
- `hooks/`: Browser hooks for hydration, theme, keyboard shortcuts, element size, and space-drag panning.
- `lib/`: Domain types, constants, templates, IndexedDB, export engine, graph layout, storage, and optional sync.
- `store/`: Zustand workspace store and actions.
- `public/`: PWA manifest, service worker, and app icon.
- `tests/`: Unit, integration, and Playwright E2E coverage.

## IndexedDB Strategy

Dexie owns the local database `InfiniteCanvasNotes` with tables for `notes`, `connections`, `groups`, and `settings`.

The app hydrates once on launch. If the database is empty, a starter Mind Map workspace is seeded. Store actions persist fine-grained changes in the background:

- Notes are saved on create/edit and bulk-saved after drag commits.
- Deleting notes also deletes incident connections.
- Connections and settings are persisted independently.
- Full workspace replacement is used for import and template-scale operations.

If IndexedDB is unavailable, the app falls back to an in-memory workspace so the UI remains usable.

## Rendering Architecture

The primary canvas is a custom renderer for predictable high-volume interaction:

- Viewport state is a simple `{ x, y, zoom }` transform.
- Wheel zoom preserves the cursor's world point.
- Space plus drag and pan mode move the viewport.
- Notes are positioned in world coordinates and transformed by a single parent layer.
- Virtualization filters notes against the visible world rect plus margin.
- Connections render in one SVG layer and only include visible endpoints.
- Groups render as lightweight dashed bounds around member notes.

This architecture keeps canvas interaction smooth with 500+ notes and 1000+ connections because dragging updates only simple coordinates and memoized visible subsets.

## Graph Engine

Graph View uses React Flow for graph rendering and D3 force layout for positions. The layout clusters nodes by the first tag or group, applies link distance, collision, charge, and cluster forces, then passes stable coordinates to React Flow with animated edge styles.

## Export Architecture

`lib/export/exporter.ts` provides all export formats:

- JSON graph: full workspace snapshot plus metadata.
- Markdown ZIP: one Markdown file per note, frontmatter with note metadata, a connection index, and `workspace.json`.
- PNG and SVG: DOM capture of the canvas export root via `html-to-image`.

Import accepts the JSON graph format and replaces the local IndexedDB workspace.

## Offline And PWA

The manifest in `public/manifest.webmanifest` makes the app installable. The service worker caches the app shell, Next static assets, and same-origin GET responses. Runtime data remains in IndexedDB, so the workspace is available offline after first load.

Storage quota monitoring uses `navigator.storage.estimate()` and is surfaced in the export panel.

## Optional Sync Layer

`lib/sync/webrtc.ts` contains a manual offer/answer WebRTC data-channel session. It can exchange complete workspace snapshots between peers. The feature is disabled by default through `NEXT_PUBLIC_ENABLE_PEER_SYNC=false` and the settings flag.

## Performance Strategy

- Custom canvas rendering for the main editing surface.
- Visible-world virtualization for notes and connection filtering.
- Memoized computed sets for visible notes, visible connections, group bounds, and graph nodes.
- A single CSS transform for pan/zoom instead of per-note screen-coordinate recalculation.
- Drag movement batches coordinate updates and persists after pointer release.
- React Flow is used only in graph mode, keeping the canvas editing path lean.

## Testing Strategy

- Unit tests cover export serialization, graph layout, and workspace-store actions.
- Integration tests cover Markdown editor behavior.
- Playwright covers the core browser path: create, edit, search, and graph view.

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```
