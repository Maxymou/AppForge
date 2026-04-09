# AppForge

Visual application builder with mind map and flow UX modules.

## Requirements

- Docker
- Docker Compose

## Quick Start

```bash
docker compose up -d
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Login**: `admin@appforge.local` / `admin123`

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
| `DATABASE_URL` | postgres://... | PostgreSQL connection string |
| `JWT_SECRET` | super_secret... | JWT signing secret (change in prod) |
| `ADMIN_EMAIL` | admin@appforge.local | Admin login email |
| `ADMIN_PASSWORD` | admin123 | Admin login password |
| `PORT` | 4000 | Backend port |

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
