# Infinite Canvas Notes

Infinite Canvas Notes is a local-first web app for markdown notes, spatial thinking, and visual knowledge graphs. It opens immediately, stores data in IndexedDB, works offline as an installable PWA, and exports the full workspace as JSON, Markdown, PNG, or SVG.

## Features

- Infinite pan and zoom canvas with drag selection, touch support, minimap, zoom controls, grid, grouping, and virtualized note rendering.
- Markdown notes with live editing, live preview, headings, code blocks, inline code, tables, links, images, task lists, and blockquotes.
- Typed connections with labels and styles: related, causes, references, supports, and custom.
- Force-directed graph view using React Flow and D3 force layout.
- Global fuzzy search across titles, content, and tags.
- Templates for mind maps, project planning, Zettelkasten, and research notes.
- Offline-first IndexedDB persistence, service worker app shell caching, PWA manifest, and storage quota monitoring.
- Optional WebRTC peer sync architecture in `lib/sync/webrtc.ts`, disabled by default.

## Getting Started

```bash
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## Deployment

Deploy to Vercel with the included `vercel.json`.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Create a Vercel project from the repository.
3. Keep the default framework preset: Next.js.
4. Set optional environment variables from `.env.example`.
5. Deploy.

The app has no server-side storage requirement. User data stays in the browser unless the user exports or enables a future sync flow.
