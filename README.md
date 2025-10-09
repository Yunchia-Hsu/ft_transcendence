# Fullstack Pong Game with AI opponent
## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React features with modern patterns
- **TypeScript** - Full type safety across the application
- **Tailwind CSS** - Utility-first styling for UI components
- **Custom CSS** - Game-specific styles for canvas and pixel-perfect rendering

### Backend
- **Hono.js** - Fast, lightweight web framework optimized for edge deployment
- **TypeScript** - End-to-end type safety
- **Zod** - Runtime schema validation

### Database
- **SQLite** - Lightweight, embedded database for simplicity and performance

### Architecture
- **Monorepo Structure** - Clean code organization with shared packages
- **Docker** - Containerized deployment for consistency across environments

### Features
- **i18n** - Built-in internationalization support
- **Real-time Gaming** - Optimized for low-latency gameplay experience

## 🎨 Styling Strategy

This project uses a hybrid styling approach:

**Tailwind CSS** handles:
- UI components (buttons, forms, layouts)
- Responsive design utilities
- Typography and spacing systems
- Color schemes and theming

**Custom CSS** manages:
- Game canvas and viewport rendering
- Complex game-specific layouts
- Performance-critical animations
- Pixel-perfect game elements

## Notable features:

- 2FA Authentication with JWT tokens
- Google Auth
- AI Opponent
- Match history and dashboard
- Friend requests sending in real time
- User customizaton
- Option to run with Docker
- Multiple language support
- Different play modes (tournament)


## Overview

Monorepo powered by **Turborepo**, **TypeScript**, and **Hono**.
The API is documented with Swagger UI and (by default in dev) runs in **Docker**; the frontend runs locally with hot reload.

- API base URL (Docker mode): `http://localhost:4001`
- Swagger UI: `http://localhost:4001/ui`
- OpenAPI JSON: `http://localhost:4001/doc`

## Requirements

- **Node.js** ≥ 18
- **pnpm** 9.x
- **Docker** & **Docker Compose**

## Install

```bash
pnpm install
```

---

## Dev workflow
Added a hiden file name .env in path apps/api, and the content is JWT_SECRET='secret'
By default, `pnpm run dev` starts Docker (API + DB) and then runs everything **except** the API/infra locally (e.g., the frontend).
Your root scripts:

# 📜 Scripts Cheat Sheet

### **Switch modes**

- **`pnpm run dev`** 🚀
  Run **all packages** in dev mode using Turbo (`turbo run dev`).
  → Starts API, game frontend, infra, etc.

- **`pnpm run dev:local`** 💻
  `docker compose down && turbo run dev`
  → First stop Docker containers (so they don’t clash with ports), then run everything locally with Turbo.

- **`pnpm run dev:api`** 🔧
  `pnpm --filter api run dev`
  → Only start the **API service** locally (ignores everything else).

- **`pnpm run dev:game`** 🎮
  `pnpm --filter game run dev`
  → Only start the **game frontend** locally. Use this when API is running separately (e.g., in Docker).

---

### **Docker control**

- **`pnpm run up`** 🐳⬆️
  `docker compose up -d`
  → Start Docker containers in detached mode (API, DB, etc).

- **`pnpm run down`** 🐳⬇️
  `docker compose down`
  → Stop all containers (keeps volumes/data unless `-v` used).

- **`pnpm run restart`** 🔄
  `docker compose restart api`
  → Restart **only the API container** (useful after code/image updates).

- **`pnpm run logs`** 📜
  `docker compose logs -f api`
  → Stream **live logs** from the API container.

- **`pnpm run rebuild`** 🛠️
  `docker compose down -v --rmi local --remove-orphans && docker compose build --no-cache && docker compose up -d`
  → Full reset:
  1. Stop & remove containers/volumes/images/orphans.
  2. Build fresh images (no cache).
  3. Start everything again.

---

### **Build & quality**

- **`pnpm run build`** 🏗️
  `turbo run build`
  → Compile/build all workspaces (API, game, infra, shared packages).

- **`pnpm run lint`** 🧹
  `turbo run lint`
  → Run lint checks across all packages.

- **`pnpm run format`** ✨
  `prettier --write "**/*.{ts,tsx,md}"`
  → Auto-format TypeScript + Markdown files.

- **`pnpm run check-types`** 🔍
  `turbo run check-types`
  → Run TypeScript type-checking across all packages (no emit).

### Command cheatsheet

| Command              | What it does                                                                                                    | API runs where?                                                    | DB lives where?                                 | Use when…                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm run dev`       | Runs all **dev tasks via Turborepo**. By default, API + DB come from Docker; frontend/game runs locally (Vite). | **Docker** → `http://localhost:4001`                               | Docker volume `ft_transcendence_games-data`     | Day-to-day dev: backend stable in Docker, frontend hot reload local.                              |
| `pnpm run dev:local` | Stops Docker, then runs **everything locally** (API, DB, game) via Turbo.                                       | **Local** → `http://localhost:4001`                                | File at `packages/infra/db/games.sqlite`        | You’re hacking on API/DB internals and don’t want Docker overhead.                                |
| `pnpm run dev:api`   | Starts **only the API locally** (with local SQLite).                                                            | **Local** → `http://localhost:4001` and `http://localhost:4001/ui` | File at `packages/infra/db/games.sqlite`        | Quick API-only work. (⚠️ Stop Docker API first to avoid port clash). /ui is for swagger andpoints |
| `pnpm run dev:game`  | Starts **only the frontend** (Vite).                                                                            | Whatever `VITE_API_BASE_URL` points to                             | n/a                                             | You only need the UI while API is already running (Docker or local).                              |
| `pnpm run up`        | `docker compose up -d` → start API + DB containers.                                                             | **Docker** → `http://localhost:4001`                               | Docker volume `ft_transcendence_games-data`     | Manually start containers; usually safe and idempotent.                                           |
| `pnpm run down`      | `docker compose down` → stop containers.                                                                        | —                                                                  | Volume persists (data is safe)                  | Shut down Docker but keep your DB data intact.                                                    |
| `pnpm run restart`   | `docker compose restart api` → restart only the API container.                                                  | **Docker** → `http://localhost:4001`                               | Docker volume `ft_transcendence_games-data`     | Fast way to reload API after config/code changes in the container.                                |
| `pnpm run logs`      | `docker compose logs -f api` → follow API logs from Docker.                                                     | Docker                                                             | Docker volume `ft_transcendence_games-data`     | Inspect API runtime logs inside container.                                                        |
| `pnpm run rebuild`   | Full reset: stop & remove containers/volumes/images, rebuild images w/o cache, then `up -d`.                    | **Docker** → `http://localhost:4001` (fresh)                       | New Docker volume `ft_transcendence_games-data` | After Dockerfile or dependency changes; guarantees clean rebuild.                                 |

> FUTURE->Frontend → API URL (Vite example): create `apps/game/.env.local` with
> `VITE_API_BASE_URL=http://localhost:4001`

---

## Docker & Data

- The API runs in Docker and uses a **named volume**: `ft_transcendence_games-data`.
- The SQLite DB file (`games.sqlite`) is **inside that volume**, mounted at `/app/packages/infra/db` in the container.
- The repo’s `packages/infra/db/` folder can be empty; Docker overlays it at runtime.
- Reset DB (⚠️ deletes data): `docker compose down -v`
- Backup DB to host:

  ```bash
  docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
    sh -c 'cp /data/games.sqlite /backup/games.sqlite.backup'
  ```

> Volumes are **per-machine**. Teammates won’t get your data automatically; share a snapshot if needed.

---

## Testing the API

### Curl quick checks

Start the stack (Docker mode):

```bash
pnpm run dev
```

List games:

```bash
curl http://localhost:4001/api/games
```

Start a game:

```bash
curl -X POST http://localhost:4001/api/games/start \
  -H "Content-Type: application/json" \
  -d '{"player1":"Alice","player2":"Bob"}'
```

Get status (replace `<id>` from the `start` response):

```bash
curl http://localhost:4001/api/games/<id>
```

Make a move:

```bash
curl -X POST http://localhost:4001/api/games/<id>/move \
  -H "Content-Type: application/json" \
  -d '{"playerId":"Alice","move":"UP"}'
```

Filter list:

```bash
curl "http://localhost:4001/api/games?status=In%20Progress"
curl "http://localhost:4001/api/games?player=Alice"
```

### Postman usage

1. **Create an environment** (name it `ft_transcendence`) with:

- `baseUrl` = `http://localhost:4001`

2. **Create requests**:

- **Start game**
  `POST {{baseUrl}}/api/games/start`
  Body → raw JSON:

  ```json
  { "player1": "Alice", "player2": "Bob" }
  ```

- **List games**
  `GET {{baseUrl}}/api/games`
  Optional query params: `status`, `player`.

- **Get game status**
  `GET {{baseUrl}}/api/games/{{gameId}}`

- **Make move**
  `POST {{baseUrl}}/api/games/{{gameId}}/move`
  Body → raw JSON:

  ```json
  { "playerId": "Alice", "move": "UP" }
  ```

3. **Docs in Postman**
   You can also import the OpenAPI doc from: `{{baseUrl}}/doc` (Postman → Import → Link → paste the URL). That auto-generates a Postman collection.

---

## Updating Docker after code changes

- If you changed only frontend code (running locally), no Docker rebuild is needed.
- If you changed the API code, dependencies, or Dockerfile, rebuild:

```bash
pnpm run rebuild     # docker compose build --no-cache && docker compose up -d
pnpm run logs        # tail container logs
```

---

## Troubleshooting

- **Port already in use (4001)**: You probably started a local API while Docker’s API is running.
  Either stop Docker (`pnpm run down`) or use local-only mode (`pnpm run dev:local`), or change the local API port (e.g., `PORT=4101 pnpm run dev:api`).

- **Teammates see empty DB**: Volumes are local. Share a snapshot or seed data:
  - Export:

    ```bash
    docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
      sh -c 'cd /data && tar czf /backup/games-data.tgz .'
    ```

  - Teammate import:

    ```bash
    docker volume create ft_transcendence_games-data
    docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
      sh -c 'cd /data && tar xzf /backup/games-data.tgz'
    ```
