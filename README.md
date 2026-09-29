# Toolhub

Toolhub is an internal portal that gives each team member one place to open the tools they are allowed to use. Superadmins manage the tool catalog, admins manage users and their access, and users see only the tools assigned to them.

## Features

- Role-based access for three roles: superadmin, admin, user
- Tool catalog grouped by category (Finance, Marketing, Content, Operations, HR, Sales, General)
- Per-user category and tool assignments
- Favorites for quick access
- Activity log of logins and tool launches
- Live access notifications over server-sent events
- Self sign-up with approval (new accounts start as `pending`)
- Password reset by email

## Roles

| Role | Access |
| --- | --- |
| `superadmin` | Everything. Manages the tool catalog and per-user tool assignments. |
| `admin` | Manages users, assigns categories, views the activity log. |
| `user` | Opens assigned tools, keeps favorites, edits own profile. |

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS, React Router, TanStack Query, Zustand, Framer Motion |
| Backend | Node.js 20, Express 4, Prisma 5, PostgreSQL 16, Zod, Nodemailer |
| Auth | JWT stored in an HTTP cookie, bcrypt password hashing, login rate limiting |
| Monorepo | npm workspaces, Turborepo |

## Project structure

```
toolhub/
├── backend/              Express API
│   ├── prisma/           Schema, migrations, seed script
│   └── src/              Routes, controllers, services, middleware, validators
├── frontend/             React app (Vite)
├── packages/
│   ├── api-client/       Typed API calls used by the frontend
│   ├── auth/             Auth helpers and role guards
│   ├── config/           Shared roles, categories, constants, design tokens
│   └── ui/               Shared React components
├── Dockerfile            Production image (API plus built frontend)
└── docker-compose.yml    App and PostgreSQL containers
```

## Getting started

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- A PostgreSQL 16 database

### Setup

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Create the backend env file and fill in your values:

   ```bash
   cp .env.example backend/.env
   ```

   At minimum, set `DATABASE_URL`, `JWT_SECRET`, and the `SUPERADMIN_*` accounts.

3. Generate the Prisma client. It is written to `backend/src/generated/` and is not committed:

   ```bash
   npm run generate --workspace=backend
   ```

4. Run migrations and seed the database:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   The seed creates the categories, the default tools, and the two superadmin accounts from your env file. It only adds records that are missing and never overwrites existing ones.

5. Start the app:

   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5001 (set `FRONTEND_PORT` to change it)
   - API: http://localhost:4000 (set `PORT` to change it)

   Vite proxies `/api` to the backend, so open the frontend URL and sign in with `SUPERADMIN_EMAIL1` and `SUPERADMIN_PASSWORD1`.

## Environment variables

All variables live in `backend/.env`. See [.env.example](.env.example) for the full list with placeholder values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign auth tokens. Use a long random value. |
| `SUPERADMIN_EMAIL1`, `SUPERADMIN_PASSWORD1` | Yes | Primary superadmin created by the seed |
| `SUPERADMIN_EMAIL2`, `SUPERADMIN_PASSWORD2` | Yes | Second superadmin. Its logins and tool launches are not written to the activity log. |
| `PORT`, `FRONTEND_PORT` | No | API port (default 4000) and dev frontend port (default 5001) |
| `CORS_ORIGINS` | No | Comma-separated list of allowed origins |
| `APP_URL` | No | Public frontend URL, used to build password reset links |
| `EMAIL_*`, `DEFAULT_FROM_EMAIL` | No | SMTP settings for password reset and account emails |
| `LINKED_TOOL_*` | No | Credentials for syncing tool access with the linked external tool |
| `DEPLOY_HOST` | No | Host used by the seed to build default tool URLs (default `localhost`) |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_ATTEMPTS` | No | Failed login limit per email |

## Scripts

Run these from the repo root.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the backend (nodemon) and frontend (Vite) together |
| `npm run build` | Builds all workspaces |
| `npm run type-check` | Type-checks all workspaces |
| `npm run db:migrate` | Applies Prisma migrations in development |
| `npm run db:seed` | Seeds categories, tools, and superadmin accounts |
| `npm run db:studio` | Opens Prisma Studio to browse the database |

## Running with Docker

```bash
docker compose up -d --build
```

Before you run it:

- `backend/.env` must exist. It is loaded into the app container.
- A root `.env` must set `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for the Postgres container.
- `DATABASE_URL` in `backend/.env` must point at the `db` service, for example `postgresql://USER:PASSWORD@db:5432/DATABASE?schema=public`.

On start, the app container runs migrations, runs the seed, then serves the API and the built frontend. It is published on `DEPLOY_PORT` (default 1002). A health check is available at `GET /health`.

## Security

- Never commit `backend/.env` or any file with real credentials. `.gitignore` already blocks them.
- Change the seeded superadmin passwords after the first login.
