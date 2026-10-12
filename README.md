# Laundry POS Web

Frontend foundation for Laundry POS, built with React, TypeScript, Vite, Tailwind CSS, and React Router.

## Requirements

- Node.js 22.22+ on the 22.x release line, or Node.js 24+ (recommended)
- npm

## Run locally

From this repository's root:

```sh
npm ci
cp .env.example .env
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`.
Open the local URL printed by Vite (normally `http://localhost:5173`). The starter runs without a backend.

## Environment configuration

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Absolute HTTP/HTTPS backend base URL |

Configuration is read centrally in `src/config/env.ts`. Import `env.apiBaseUrl` when adding API services. Trailing slashes are removed. Invalid URLs fail during startup rather than silently using an incorrect address.

Vite embeds `VITE_` variables in the browser bundle: never use them for secrets. Restart the dev server after changing `.env`; rebuild to change production configuration. Local environment files are ignored by Git.

## Commands

```sh
npm run lint     # ESLint
npm run build    # TypeScript checks and production build into dist/
npm run preview # Serve the production build locally
```

## Project structure

```text
src/
  components/  Shared UI components
  config/      Environment configuration
  layouts/     Shared application layout and navigation
  pages/       Route-level pages
  styles/      Tailwind entry point and global styles
  App.tsx      Route definitions
  main.tsx     Application entry point and router provider
```

The starter includes an overview, customer and service sections marked as coming soon, and a fallback page for unknown routes. Login and operational features are separate follow-up issues. No authentication or API requests are implemented yet.

## Deployment

Serve the generated `dist/` directory with a static host. Configure the host to serve `index.html` for application routes such as `/customers` and `/services`, so direct links and browser refresh work with `BrowserRouter`.
