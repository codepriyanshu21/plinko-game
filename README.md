# Plinko Lab — Provably Fair Plinko Game

Lightweight, deterministic Plinko game with a commit-reveal fairness protocol, built on Next.js + TypeScript and a Neon/Postgres backend.

This README focuses on developer setup, scripts, and troubleshooting for this workspace.

---

## Quick Start

1. Install dependencies:

```powershell
npm install
```

2. Create a `.env` from your local template and set `DATABASE_URL` (Neon or Postgres):

```powershell
copy .env .env.local
# Edit .env.local and set DATABASE_URL
```

3. Run the database migration (TypeScript script uses `ts-node`):

```powershell
npm run migrate-db
```

4. Start the dev server:

```powershell
npm run dev
# Open http://localhost:3000
```

## Important NPM Scripts

- `npm run dev` — start Next.js in development
- `npm run build` — production build
- `npm run start` — start built app
- `npm run migrate-db` — run TypeScript DB migration (`scripts/migrate-db.ts`) via `ts-node`
- `npm test` — run unit tests (uses `vitest`)

## Project notes

- The app uses a commit-reveal flow: server creates a `serverSeed` + `nonce` and stores `commitHex = sha256(serverSeed:nonce)`. The client supplies a `clientSeed`. Combined seed determines deterministic peg map and path.
- The UI canvas is responsive and sized to its container (ResizeObserver). The code was updated to avoid top-level `window` references so Server-Side Rendering (Next.js) doesn't crash.
- The project previously included a package (`vaul`) that declared a peer dependency incompatible with React 19 — that dependency was removed to resolve ERESOLVE during install.

## Tests

Run unit tests with Vitest:

```powershell
npm test
```

Test files live under `__tests__/` and cover crypto utilities, PRNG, peg-map generation and the plinko engine.

If TypeScript complains about test globals (`expect`, `describe`) ensure `vitest` is installed and the `/// <reference types="vitest" />` lines are present at the top of the test files (they were added automatically in this repo).

## Database migration

- Migration script: `scripts/migrate-db.ts` — it reads `scripts/create-round-table.sql` and runs the statements using the `@neondatabase/serverless` client.
- Run: `npm run migrate-db` (requires `DATABASE_URL` in `.env.local`).

## Troubleshooting

- ERESOLVE / peer dependency errors: if you run into a peer conflict during `npm install`, either remove the conflicting package (we removed `vaul`) or run:

```powershell
npm install --legacy-peer-deps
```

- `ReferenceError: window is not defined` during SSR: indicates client-only code ran on the server. The canvas code now runs window-dependent logic inside `useEffect` / ResizeObserver; restart the dev server after pulling changes.

- `Invalid source map` warnings during dev: often benign and produced by third-party packages. They don't usually break the app; if you want to silence or fix them, we can identify the package producing the bad source map.

- Running `ts` scripts directly with `node` will fail on `.ts` files. Use `npm run migrate-db` (uses `ts-node`) or compile via `tsc` first.

## Responsive UI

- The main page and components include responsive Tailwind classes. The canvas scales to its container and the paytable/control panels use responsive grids and paddings for mobile.
- If you want tighter mobile visuals (smaller peg/ball radii or scaled fonts), we can add proportional drawing parameters based on `canvasWidth`.

## Deployment

- Vercel (recommended for Next.js): push to GitHub and connect the repo. Set `DATABASE_URL` in Vercel project settings.
- Other platforms: build and deploy using the platform's Node/Next instructions.

---

If you'd like, I can:

- run `npm install` and `npm test` here and paste the logs,
- add mobile-specific drawing scale for the canvas, or
- investigate the `Invalid source map` warnings and remove the offending map.

License: MIT

