# e-school-fe

React SPA for the Online School diploma thesis project. Talks exclusively to the
independent `e-school-be` Laravel API over REST/JSON + Sanctum cookie auth - never
assume access to the BE codebase; the API contract is the only shared surface.

## Stack & conventions

- React 19 + TypeScript, Vite, React Router, Zustand, Tailwind CSS (v4, CSS-first
  config via `@import 'tailwindcss'` in `src/index.css` - no `tailwind.config.js`
  needed unless a real customization comes up).
- No TanStack Query / SWR - a small hand-written fetch wrapper
  (`src/shared/api/client.ts`) is enough at this project's scope. Don't add a data
  fetching library "for later" - add it only when a real caching/refetch need shows
  up.
- ESLint (flat config, `eslint.config.js`) + Prettier - `npm run lint`, `npm run
  format`.
- Auth: Sanctum SPA cookie mode. Every mutating request needs a fresh CSRF cookie
  first (`ensureCsrfCookie()` in the api client handles this automatically) and
  `credentials: 'include'` on every request - never switch to Bearer tokens.

## Folder structure - package by feature, grow structure only under real pain

Per the architecture doc's "gradual approach": start with one file per feature, add
`components/`, `hooks/`, `types/` subfolders only once a feature actually needs them,
and reach for `domain/`/`useCases/`/`infrastructure/` layers only for a feature with
real standalone logic (the test-taking/grading feature, `features/tests`, is the one
expected to get there - question pool selection and the timer are worth testing in
isolation from React).

- `src/app` - root App component, router, top-level providers.
- `src/shared` - cross-feature code: `api` (fetch wrapper), `auth` (session store +
  guards), `ui` (generic presentational primitives with no feature knowledge).
- `src/features/<name>` - one folder per domain feature (auth, calendar, tests,
  grades, profile, analytics, notifications, demo-simulator, ...).

## Known constraints from the spec

- No UI for creating/editing questions or lesson material - that's seeder/CSV only,
  by deliberate scope decision. Don't build admin CRUD screens for those.
- Grading scale and weighted-average formula are fixed business rules (see BE) -
  render what the API returns, don't recompute grades client-side.
