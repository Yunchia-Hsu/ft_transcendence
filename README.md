# ft_transcendence

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

By default, `pnpm run dev` starts Docker (API + DB) and then runs everything **except** the API/infra locally (e.g., the frontend).
Your root scripts:

**Day-to-day dev**

- `predev` 🐳⚙️ — **Auto-runs before `dev`**. Starts (or keeps) Docker containers in the background (`docker compose up -d`) so the API + DB are ready. Safe to run repeatedly; won’t wipe data. You normally **don’t call it directly**—just run `pnpm run dev`.
- `pnpm run dev` 🚀 — Backend in **Docker**, frontend locally (hot reload). _(Runs `predev` automatically.)_

**Switch modes**

- `pnpm run dev:local` 💻 — Stop Docker; run **everything locally** (API + frontend).
- `pnpm run dev:api` 🔧 — Run **only the API locally** (make sure Docker API isn’t running).
- `pnpm run dev:game` 🎮 — Run **only the frontend** (use when API is in Docker).

**Docker control**

- `pnpm run up` 🐳⬆️ — Start containers (API + DB volume).
- `pnpm run down` 🐳⬇️ — Stop containers (data stays).
- `pnpm run logs` 📜 — Tail API container logs.
- `pnpm run rebuild` 🛠️ — Rebuild image (no cache) and restart.

**Build & quality**

- `pnpm run build` 🏗️ — Build all packages.
- `pnpm run lint` 🧹 — Lint code.
- `pnpm run format` ✨ — Format files.
- `pnpm run check-types` 🔍 — Type-check all packages.

### Command cheatsheet

| Command              | What it does                                                                                                   | API runs where?                                             | DB lives where?                                   | Use when…                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm run dev`       | **Runs `predev` first**, which brings up Docker, then starts all local dev tasks **except** `api` and `infra`. | **Docker** → `http://localhost:4001`                        | Docker named volume `ft_transcendence_games-data` | Day-to-day dev: backend in Docker, frontend locally with hot reload. |
| `pnpm run dev:local` | Stops Docker containers, then runs **everything locally** via Turborepo.                                       | **Local** → `http://localhost:4001`                         | Local file at `packages/infra/db/games.sqlite`    | You want to hack on the API itself without Docker in the loop.       |
| `pnpm run dev:api`   | Starts only the **local API** (no Docker).                                                                     | **Local** → `http://localhost:4001`                         | Local file at `packages/infra/db/games.sqlite`    | Quick API-only work. (Make sure Docker API isn’t running.)           |
| `pnpm run dev:game`  | Starts only the **frontend** (Vite).                                                                           | Whatever your frontend points to (set `VITE_API_BASE_URL`). | n/a                                               | You just need the UI while API is already in Docker.                 |
| `pnpm run up`        | `docker compose up -d`                                                                                         | **Docker** → `http://localhost:4001`                        | `ft_transcendence_games-data`                     | Manually start containers. Idempotent.                               |
| `pnpm run down`      | `docker compose down`                                                                                          | —                                                           | Volume persists (not deleted)                     | Stop containers but keep data.                                       |
| `pnpm run logs`      | Tails Docker API logs.                                                                                         | Docker                                                      | `ft_transcendence_games-data`                     | See server output.                                                   |
| `pnpm run rebuild`   | Rebuild Docker image (no cache) and restart.                                                                   | Docker                                                      | `ft_transcendence_games-data`                     | After Dockerfile or dependency changes.                              |

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
