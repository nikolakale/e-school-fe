# e-school-fe

React + TypeScript SPA for the Online School project (diploma thesis rebuild). Talks
to the independent `e-school-be` Laravel API via Sanctum SPA (cookie) authentication.

## Requirements

- Node.js 20+ (or Docker).
- A running `e-school-be` instance (see that repo's README) reachable at the URL in
  `VITE_API_URL`.

## Running with Docker

```bash
docker compose up -d
```

Serves the dev server at `http://localhost:5173`.

## Running natively

```bash
cp .env.example .env
npm install
npm run dev
```

## Scripts

```bash
npm run dev          # start dev server
npm run build         # typecheck + production build
npm run lint           # eslint
npm run format         # prettier --write
npm run format:check   # prettier --check
npm run typecheck      # tsc, no emit
```
