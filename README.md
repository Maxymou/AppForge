# AppForge

Visual application builder with mind map and flow UX modules.

## Requirements

- Docker
- Docker Compose

## Quick Start

```bash
docker compose up -d --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

### Default admin login

At backend startup, AppForge automatically checks `ADMIN_EMAIL` + `ADMIN_PASSWORD` and seeds an admin user **only if this email does not already exist**.

- First startup with an empty database: admin user is created automatically.
- Subsequent startups: if user already exists, AppForge does not recreate or overwrite that user/password.
- Login credentials come from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- If env vars are missing, backend logs clearly indicate that admin seeding is skipped/failed.

Default values in this repository:

- `ADMIN_EMAIL=admin@appforge.local`
- `ADMIN_PASSWORD=admin123`

## Installable PWA

AppForge ships as an installable Progressive Web App. It works as a regular
responsive web app on desktop and can be installed on the home screen on both
Android and iPhone:

- **Android / desktop (Chrome / Edge)** — menu → "Install app".
- **iPhone / iPad (Safari)** — Share → "Add to Home Screen".

Once installed, AppForge runs fullscreen in standalone mode with the brand
status bar color, stable height across rotations, and correctly handles the
iPhone notch / home indicator safe areas (no white bar at the bottom).

All the details (how it was wired, how the iOS `--app-height` strategy works,
how to write new fullscreen screens and modals so they don't regress) are
documented in [`frontend/docs/PWA_SETUP.md`](frontend/docs/PWA_SETUP.md).

## Modules

### 1. Roadmap (Mind Map)
- Tree structure with sections and items
- Inline editing (double-click to edit)
- Add / delete nodes
- Import / Export as `roadmap.md`

**Markdown format:**
```md
# Frontend
- Navbar
- Routing

# Backend
- API
- Auth
```

### 2. Projects (Flow UX)
- Full-screen React Flow canvas
- Drag & drop nodes
- Connect nodes with edges
- Click a node → side panel (title, description, notes, items)
- Auto-save (2s debounce)
- Version history + rollback
- Duplicate projects
- Read-only mode
- Import / Export as `project.md`

**Markdown format:**
```md
# PROJECT: NomProjet

## FLOW
Login → Dashboard → Map

---

## NODES

### Login Page
- email + password
- validation

### Dashboard
- accès rapide

---

## CONTEXT

Structure fonctionnelle d'une application.

---

## INSTRUCTIONS IA

Tu dois :
- modifier ce fichier
- ajouter / modifier / supprimer des éléments
- garder EXACTEMENT la structure

IMPORTANT :
Retourne EXACTEMENT ce fichier modifié.
```

## Configuration

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | postgresql://... | PostgreSQL connection string |
| `JWT_SECRET` | super_secret... | JWT signing secret (change in prod) |
| `ADMIN_EMAIL` | admin@appforge.local | Admin login email used for startup seeding |
| `ADMIN_PASSWORD` | admin123 | Admin login password used for startup seeding |
| `PORT` | 4000 | Backend port |

### Backend runtime compatibility (Prisma + OpenSSL)

The backend container runs Prisma (`prisma generate`, `prisma migrate deploy`) at startup/build time.
To avoid runtime crashes linked to OpenSSL detection on Alpine, AppForge backend uses a Debian slim Node image with OpenSSL libraries installed in-container.

This keeps deployment reproducible on a clean Ubuntu host with only Docker + Docker Compose installed.

### Important behavior for existing databases

If your database already contains `ADMIN_EMAIL`, changing `ADMIN_PASSWORD` in `.env` **does not** update that existing password automatically.

This is expected and prevents accidental password overwrite in persistent environments.

## Update application over SSH

Use this workflow on your server to update an existing deployment.

### 1) Connect and go to project folder

```bash
ssh <user>@<server>
cd /path/to/AppForge
```

### 2) Pull latest changes and rebuild/restart containers

```bash
git pull
docker compose down
docker compose up -d --build
```

### 3) Check services and backend logs

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 postgres
```

### 4) Restart services cleanly (without deleting data)

```bash
docker compose down
docker compose up -d --build
```

### 5) Optional: full test reset (deletes database data)

Use only for non-production/test environments.

```bash
docker compose down -v
docker compose up -d --build
```

> `-v` removes Docker volumes, including Postgres data (`postgres_data`).
> Without `-v`, Postgres data persists across restarts and updates.

## Reset default admin in test environments

If you want AppForge to recreate the default admin from env values:

1. Stop services and delete volumes: `docker compose down -v`
2. Start again: `docker compose up -d --build`

⚠️ This removes **all** database data (users, roadmap, projects, versions).

## Troubleshooting (backend not starting)

If frontend is up but login fails, check backend and database first:

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 postgres
```

Typical healthy backend startup logs include:

- `[startup] database connected`
- `[seed] admin user created: admin@appforge.local` (first boot on empty DB)
- or `[seed] admin user already exists: admin@appforge.local` (subsequent boots)
- `AppForge backend running on port 4000`

Reminder: changing `ADMIN_PASSWORD` in `.env` does **not** overwrite an existing admin password if the user already exists in Postgres.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Flow, Framer Motion |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Infra | Docker, Docker Compose, Nginx |

## Project Structure

```
AppForge/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── index.js
│       ├── middleware/auth.js
│       ├── utils/seedAdmin.js
│       └── routes/
│           ├── auth.js
│           ├── roadmap.js
│           └── projects.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx
        ├── api/client.js
        ├── stores/
        │   ├── authStore.js
        │   ├── roadmapStore.js
        │   └── projectStore.js
        └── components/
            ├── auth/LoginPage.jsx
            ├── layout/Sidebar.jsx
            ├── layout/MobileNav.jsx
            ├── roadmap/RoadmapView.jsx
            ├── roadmap/TreeNode.jsx
            └── projects/
                ├── ProjectList.jsx
                ├── FlowCanvas.jsx
                ├── NodePanel.jsx
                └── CustomNode.jsx
```

## API Endpoints

### Auth
- `POST /api/auth/login` — get JWT token
- `GET /api/auth/me` — get current user

### Roadmap
- `GET /api/roadmap` — get full tree
- `POST /api/roadmap/nodes` — create node
- `PUT /api/roadmap/nodes/:id` — update node
- `DELETE /api/roadmap/nodes/:id` — delete node
- `POST /api/roadmap/import` — import markdown
- `GET /api/roadmap/export` — export markdown

### Projects
- `GET /api/projects` — list projects
- `POST /api/projects` — create project
- `GET /api/projects/:id` — get project with nodes + edges
- `PUT /api/projects/:id` — update project
- `DELETE /api/projects/:id` — delete project
- `POST /api/projects/:id/save` — save full canvas state (creates version)
- `GET /api/projects/:id/versions` — list versions
- `POST /api/projects/:id/versions/:versionId/rollback` — rollback
- `POST /api/projects/:id/duplicate` — clone project
- `POST /api/projects/:id/import` — import markdown
- `GET /api/projects/:id/export` — export markdown
