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

## UX highlights

AppForge ships a pragmatic, keyboard-friendly UX:

- **Navigation produit clarifiée** — la navigation principale se concentre désormais sur **Roadmap**, **Projets** et **Liens**, tandis que la déconnexion est regroupée dans **Paramètres**.
- **Consistent confirmations** — every destructive action (delete a
  section, delete a project, delete a node, rollback a version, replace
  a canvas on import) goes through a styled confirm dialog with a clear
  impact summary. No more native `window.confirm` pop-ups.
- **Contextual tooltips** — icon-only buttons (edit / add / delete) all
  carry both an accessible `aria-label` and a visible tooltip on hover
  and focus, so users never have to guess what an icon does.
- **Smart node placement** — adding a node to the flow canvas uses a
  non-overlap heuristic around the last created node, so newly-created
  nodes never stack on top of one another.
- **Toast feedback** — imports, exports, saves, duplications and
  deletions push a small toast so silent actions stop feeling silent.
- **Explicit "Open project"** — project cards expose a visible "Open
  project →" affordance on hover and are also fully keyboard-activatable
  via Enter / Space.
- **Contextual add inputs** — adding an item to a roadmap section
  reuses the parent title in the placeholder (e.g. `New item inside
  "Frontend"...`). Enter saves, Escape cancels, blur auto-saves when
  the value is non-empty.

## Modules

### 1. Roadmap (Mind Map)
- Tree structure with sections and items
- Inline editing — double-click OR use the pencil tooltip button
- Édition enrichie par item: **titre**, **commentaire** et **bloc code**
- Aperçu condensé des commentaires/code directement dans la liste pour rester lisible
- Add / delete nodes via confirm dialog (no more raw `window.confirm`)
- Import / Export as `roadmap.md` with an explicit "replace roadmap"
  acknowledgement before the destructive import fires

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
- Full-screen React Flow canvas with enlarged, higher-contrast handles
- Drag & drop nodes
- Connect nodes with edges
- Connexions avancées: chaque item d'un nœud expose sa propre sortie connectable
- Persistance des connexions par `sourceHandle` (+ `targetHandle` prêt pour la suite)
- Click a node → side panel (title, description, notes, items) with
  sticky footer save button and an explicit "Unsaved changes" badge
- Auto-save (2s debounce) with toast confirmation on manual save
- Smart non-overlapping placement for newly added nodes
- Version history modal with per-entry date/time and a clear "Current"
  badge on the latest snapshot
- Rollback goes through a confirm dialog (no silent data loss)
- Duplicate projects (confirmation toast on success)
- Métadonnées projet enrichies: `status` (`idée`, `en cours`, `déployé`, `terminé`) + commentaire
- Read-only mode (unchanged)
- Import / Export as `project.md`, with the same explicit
  "replace canvas" acknowledgement as the roadmap import

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

### 3. Liens (persistés en base)
- CRUD complet des liens (`title`, `url`, `note`) via API backend
- Validation d'URL côté serveur
- Données isolées par utilisateur authentifié

### 4. Paramètres utilisateur
- Mise à jour du profil (`username`, `email`) avec validation email + unicité
- Changement de mot de passe (vérification du mot de passe actuel + longueur minimale)
- Déconnexion depuis la modale Paramètres

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


## Mise à jour UX mobile + français (avril 2026)

- Interface utilisateur traduite en français (auth, roadmap, projets, flow, actions principales).
- Header mobile dédié avec gestion de safe-area iPhone (`safe-top`) sur Roadmap, Projets et éditeur Flow.
- Barre de navigation mobile compacte en capsule flottante avec entrée **Liens** (le logout est déplacé dans **Paramètres**).
- Nouvelle vue **Liens** pour stocker des liens utiles (titre, URL, note) côté client.
- Paramètres utilisateur: modification du nom, email, mot de passe, déconnexion.
- Projets: ajout des champs `status` (`idee`, `en_cours`, `deploye`, `termine`) et `comment`.
- Roadmap: édition enrichie des items (titre, commentaire, code).
- Flow: mini-carte masquée sur mobile et handles de sortie par item de nœud (`sourceHandle`) pour des connexions fines.

> Après mise à jour, exécutez les migrations Prisma au déploiement (`docker compose up -d --build` les applique via le démarrage backend).

## PWA + mobile UI/UX hardening (avril 2026)

Passe de durcissement PWA + ergonomie mobile. Rapport complet dans
[`PWA_UIUX_AUDIT.md`](PWA_UIUX_AUDIT.md).

**Bugs corrigés**

- `NodePanel` mobile: plus de `82vh` brut — la feuille est désormais ancrée
  à `--app-height`, donc le footer sticky ne dépasse plus jamais sous
  l'indicateur home iOS.
- Toasts mobiles: ne passent plus **derrière** la navigation flottante du bas.
- Écran de connexion: la carte défile désormais quand le clavier iOS réclame
  la moitié de l'écran (iPhone SE + clavier ouvert).
- `LinksView`: les URLs longues ne provoquent plus de scroll horizontal sur
  iPhone SE; les actions se plient sous le contenu en mobile.
- `ActionMenu` respecte désormais les safe areas (`--sat/--sab/--sal/--sar`)
  pour ne plus clipper sous l'encoche en paysage.

**Accessibilité**

- Pinch-zoom **ré-activé** sur toutes les pages (suppression de
  `user-scalable=no, maximum-scale=1` — respect de WCAG 1.4.4). Les champs
  restent à 16 px sur mobile, donc iOS n'effectue toujours pas de zoom
  automatique au focus.
- Tous les boutons (`.btn`) atteignent **44 px de hauteur minimale** sur
  mobile (WCAG 2.5.5).
- Les `.icon-btn` + la roue de projet passent à **40 px carré** sur mobile
  (HIG Apple, zone de touche effective ≥ 44 px avec l'inter-espacement).
- La `NodePanel` mobile se ferme sur `Escape` (parité avec `Modal`).
- Contraste du placeholder des champs relevé à ~5.2:1.

**Polish**

- Navigation mobile: labels passés en `11px` + emoji en `1.05rem`, avec
  `aria-hidden` sur les emoji (lu par les lecteurs d'écran uniquement via
  le label texte).
- `TreeNode` Roadmap: les overrides de taille des IconButton sont scopés à
  `md:` afin que la règle mobile de `.icon-btn` prenne effet.

Voir [`PWA_UIUX_AUDIT.md`](PWA_UIUX_AUDIT.md) pour la liste exhaustive des
fichiers modifiés, la checklist PWA/iOS/Android et le plan de test physique
post-merge.
