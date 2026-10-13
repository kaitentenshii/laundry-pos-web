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
Open the local URL printed by Vite (normally `http://localhost:5173`). The login screen renders without a backend; signing in requires `laundry-pos-api` with its authentication migration applied and a provisioned user account.

## Environment configuration

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Absolute HTTP/HTTPS backend base URL |

Configuration is read centrally in `src/config/env.ts`. Import `env.apiBaseUrl` when adding API services. Trailing slashes are removed. Invalid URLs fail during startup rather than silently using an incorrect address.

Vite embeds `VITE_` variables in the browser bundle: never use them for secrets. Restart the dev server after changing `.env`; rebuild to change production configuration. Local environment files are ignored by Git.

## Commands

```sh
npm run lint     # ESLint
npm test         # Authentication, session, and login-flow tests
npm run build    # TypeScript checks and production build into dist/
npm run preview # Serve the production build locally
```

## Project structure

```text
src/
  assets/      Local Figma SVG assets
  auth/        Session state, restoration, and route protection
  components/  Shared UI components
  config/      Environment configuration
  layouts/     Shared application layout and navigation
  pages/       Route-level pages
  services/    Shared API request client
  styles/      Tailwind entry point and global styles
  App.tsx      Route definitions
  main.tsx     Application entry point and router provider
```

The app includes login, an overview, customer and service sections marked as coming soon, and a fallback page for unknown routes. Workspace routes require authentication. Customer and service operations remain follow-up work.

## Login and sessions

The login UI follows the [Figma login frame](https://www.figma.com/design/oy1TXoQzIlujoRoP5bc4Gp/Project-UI?node-id=5-243). It uses locally bundled Outfit fonts and the original SVG brand icon and washing-machine illustration. The form accepts a username or email and password, provides validation and loading/error states, and redirects to the requested workspace route after successful login.

The API contract is implemented by `laundry-pos-api`:

- `POST /auth/login`: JSON `{ "identifier": "<username or email>", "password": "<password>" }`. Returns `{ "access_token": "...", "token_type": "Bearer", "expires_in": 28800, "user": { "id": 1, "name": "...", "username": "...", "email": "...", "role": "admin" } }`. Roles are `admin` and `cashier`.
- `GET /auth/me`: bearer-authenticated profile check, returns `{ "user": { ... } }`.
- `POST /auth/logout`: revokes the bearer token, returns HTTP 204.

Tokens, expiry, and public user details are kept in `sessionStorage` for the current tab. Passwords and password hashes are never persisted. Restored sessions are verified by `/auth/me` before protected pages render. Expiry or an authenticated HTTP 401 clears the session and returns to login. Logout clears the local session and requests server revocation.

For new protected API calls, use `useAuth().authorizedRequest(path, options)` so the bearer token and HTTP 401 handling are applied centrally. Server-side authorization still governs API access.

Start the backend on the configured `VITE_API_BASE_URL`, apply its migrations, and create an account using its `cmd/create-user` command (see the backend README). Set the backend's `CORS_ALLOWED_ORIGINS` to the exact frontend origin, including its port. The defaults allow `http://localhost:5173` and `http://127.0.0.1:5173`.

## Deployment

Serve the generated `dist/` directory with a static host. Configure the host to serve `index.html` for application routes such as `/customers` and `/services`, so direct links and browser refresh work with `BrowserRouter`.

## Account management

Administrators can manage accounts at `/users`. The list includes last recorded activity; the create/edit dialogs follow the Figma user-management screens. The current administrator's role/status controls are disabled, and the API also prevents self-lockout. Other account changes are validated by the API; deactivation or role changes revoke that user's sessions.

The password field is only shown when creating an account, uses the Figma eight-character minimum (and bcrypt's 72-byte maximum), and is never persisted in browser storage.
