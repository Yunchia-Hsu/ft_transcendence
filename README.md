# Pong Game - ft_transcendence

A full-featured online Pong game platform with real-time multiplayer, tournaments, friends system, and two-factor authentication.

## Demo

Watch the demo video: [https://youtu.be/DNij0lZR4IU](https://youtu.be/DNij0lZR4IU)

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Development Guide](#development-guide)
- [API Documentation](#api-documentation)
- [Docker & Data](#docker--data)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Features

### Game System
- Real-time Pong game with Canvas rendering
- AI opponent mode
- 1v1 quick matchmaking

### Competitive System
- Single-elimination tournaments
- Automatic bracket generation
- Real-time matchmaking queue

### Social System
- Friend requests (send/accept/reject)
- Online status tracking
- Player search

### Security
- JWT authentication
- Two-factor authentication (2FA) with Google Authenticator
- Google OAuth integration
- bcrypt password hashing

### Additional
- Multi-language support (English, Russian, Chinese)
- Match history and dashboard
- User customization (avatar, display name)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, Zustand, Tailwind CSS |
| Backend | Hono.js, TypeScript, Zod |
| Database | SQLite + Kysely ORM |
| DevOps | Docker, Nginx, Prometheus, Grafana |
| Monorepo | Turborepo + pnpm |

### Styling Strategy

**Tailwind CSS** handles:
- UI components (buttons, forms, layouts)
- Responsive design utilities
- Typography and spacing systems

**Custom CSS** manages:
- Game canvas and viewport rendering
- Performance-critical animations
- Pixel-perfect game elements

## Quick Start

### Prerequisites
- **Node.js** >= 18
- **pnpm** >= 9
- **Docker** & **Docker Compose** (for containerized development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ponggame

# Install dependencies
pnpm install
```

### Running the Project

```bash
# Local development (no Docker)
pnpm run dev:local

# Docker development mode
pnpm run dev
```

### Access Services

| Service | URL |
|---------|-----|
| Game Frontend | http://localhost:5173 |
| API Server | http://localhost:4001 |
| Swagger UI | http://localhost:4001/ui |
| OpenAPI JSON | http://localhost:4001/doc |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |

## Environment Setup

**IMPORTANT:** The project requires `.env` files to run properly. Without these files, you will encounter errors.

### 1. API Environment Variables (Required)

Copy the example file and configure:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
# Required - MUST be set
JWT_SECRET=your-secure-secret-key-min-32-chars
PORT=4001
DB_DIR=/app/data

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://localhost/auth/google/callback

# Grafana (optional)
GF_ADMIN_USER=admin
GF_ADMIN_PASSWORD=admin
```

### 2. Frontend Environment Variables (Required)

Create the frontend environment file:

```bash
echo "VITE_API_BASE_URL=http://localhost:4001" > apps/game/.env
```

Or manually create `apps/game/.env`:

```env
VITE_API_BASE_URL=http://localhost:4001
```

### Important Notes

- **Never commit `.env` files to Git** - they contain sensitive information
- Use a strong secret key in production (at least 32 characters)
- `.env.example` files are for reference only
- Without `JWT_SECRET`, the API will fail with: `Missing/weak JWT_SECRET`
- Without `VITE_API_BASE_URL`, the frontend cannot connect to the API

## Development Guide

### Project Structure

```
ponggame/
├── apps/
│   ├── api/              # Hono.js backend API
│   └── game/             # React frontend (Vite)
├── packages/
│   ├── infra/            # Database layer (Kysely + SQLite)
│   ├── types/            # Shared TypeScript types
│   └── eslint-config/    # Shared ESLint configuration
├── nginx/                # Nginx reverse proxy config
├── prometheus/           # Prometheus monitoring config
├── grafana/              # Grafana dashboards
├── alertmanager/         # AlertManager config
└── docker-compose.yml    # Docker orchestration
```

### Scripts Cheat Sheet

#### Switch Modes

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Run all packages in dev mode via Turborepo |
| `pnpm run dev:local` | Stop Docker, run everything locally |
| `pnpm run dev:api` | Start only the API locally |
| `pnpm run dev:game` | Start only the frontend (Vite) |

#### Docker Control

| Command | Description |
|---------|-------------|
| `pnpm run up` | Start Docker containers in detached mode |
| `pnpm run down` | Stop containers (keeps volumes/data) |
| `pnpm run restart` | Restart only the API container |
| `pnpm run logs` | Stream live logs from API container |
| `pnpm run rebuild` | Full reset: stop, remove, rebuild, start |

#### Build & Quality

| Command | Description |
|---------|-------------|
| `pnpm run build` | Compile/build all workspaces |
| `pnpm run lint` | Run lint checks across all packages |
| `pnpm run format` | Auto-format TypeScript + Markdown files |
| `pnpm run check-types` | Run TypeScript type-checking |

### Command Reference Table

| Command | API Location | DB Location | Use When |
|---------|--------------|-------------|----------|
| `pnpm run dev` | Docker: `localhost:4001` | Docker volume | Day-to-day dev |
| `pnpm run dev:local` | Local: `localhost:4001` | `packages/infra/db/games.sqlite` | Hacking on API/DB |
| `pnpm run dev:api` | Local: `localhost:4001` | Local SQLite file | Quick API-only work |
| `pnpm run dev:game` | Via `VITE_API_BASE_URL` | N/A | UI only, API running elsewhere |

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/users/register` | Register new user |
| POST | `/api/auth/users/login` | Login with credentials |
| GET | `/api/auth/me` | Get current user info |
| GET | `/api/auth/users` | List all users (with search) |
| GET | `/api/auth/users/:userId` | Get user profile |
| PUT | `/api/auth/users/:userId` | Update profile |
| DELETE | `/api/auth/users/:userId` | Delete account |

### Two-Factor Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/setup-2fa` | Generate QR code for 2FA setup |
| POST | `/api/auth/activate-2fa` | Activate 2FA with code |
| POST | `/api/auth/verify-2fa` | Verify 2FA during login |

### Games

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games/start` | Start a new game |
| GET | `/api/games` | List games (filterable) |
| GET | `/api/games/:gameId` | Get game status |
| POST | `/api/games/:gameId/move` | Submit player move |
| POST | `/api/games/:gameId/complete` | Mark game as complete |
| POST | `/api/games/:gameId/terminate` | Terminate game early |

### Matchmaking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matchmaking/queue` | Join quick play queue |
| DELETE | `/api/matchmaking/queue` | Leave queue |
| GET | `/api/matchmaking/status/:userId` | Check queue/match status |

### Tournaments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tournaments` | List tournaments |
| POST | `/api/tournaments` | Create tournament |
| GET | `/api/tournaments/:id` | Get tournament details |
| DELETE | `/api/tournaments/:id` | Delete tournament |
| POST | `/api/tournaments/:id/participants` | Join tournament |
| DELETE | `/api/tournaments/:id/participants` | Leave tournament |
| POST | `/api/tournaments/:id/start` | Start tournament |
| POST | `/api/tournaments/:id/matches` | Record match result |
| GET | `/api/tournaments/:id/bracket` | Get bracket tree |

### Friends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | Get friends list |
| POST | `/api/friends/request/:friendId/send` | Send friend request |
| POST | `/api/friends/request/:friendId/accept` | Accept request |
| POST | `/api/friends/request/:friendId/reject` | Reject request |
| GET | `/api/friends/request/:friendId/retrieve` | Get pending requests |
| DELETE | `/api/friends/request/:friendId/delete` | Delete pending request |
| DELETE | `/api/friends/:friendId/delete` | Remove friend |

### User Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/onlineusers` | List online users |
| PUT | `/api/users/me/status` | Update online/offline status |

For full interactive documentation, visit **Swagger UI**: http://localhost:4001/ui

### Testing the API

#### Curl Examples

```bash
# Start the stack
pnpm run dev

# List games
curl http://localhost:4001/api/games

# Register a user
curl -X POST http://localhost:4001/api/auth/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"securepass123"}'

# Login
curl -X POST http://localhost:4001/api/auth/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"securepass123"}'

# Start a game
curl -X POST http://localhost:4001/api/games/start \
  -H "Content-Type: application/json" \
  -d '{"player1":"Alice","player2":"Bob"}'

# Make a move (replace <id> with game ID)
curl -X POST http://localhost:4001/api/games/<id>/move \
  -H "Content-Type: application/json" \
  -d '{"playerId":"Alice","move":"UP"}'
```

#### Postman Setup

1. Create an environment with `baseUrl` = `http://localhost:4001`
2. Import OpenAPI doc from: `http://localhost:4001/doc`

## Docker & Data

### Data Storage

- The API runs in Docker with a **named volume**: `ft_transcendence_games-data`
- SQLite DB file (`games.sqlite`) is inside that volume at `/app/packages/infra/db`
- Volumes persist across container restarts

### Database Operations

```bash
# Reset DB (WARNING: deletes all data)
docker compose down -v

# Backup DB to host
docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
  sh -c 'cp /data/games.sqlite /backup/games.sqlite.backup'

# Export data for sharing
docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
  sh -c 'cd /data && tar czf /backup/games-data.tgz .'

# Import data (teammate)
docker volume create ft_transcendence_games-data
docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
  sh -c 'cd /data && tar xzf /backup/games-data.tgz'
```

## Deployment

### Using Docker Compose

```bash
# Build images
make build

# Start all services
make up

# Stop services
make down

# Full rebuild (clean + build + start)
make rebuild

# Remove all containers and volumes
make clean
```

### Production Environment

Create secure `.env` files for production:

```env
# apps/api/.env
JWT_SECRET=<generate-a-strong-64-char-secret>
PORT=4001
DB_DIR=/app/data
NODE_ENV=production
```

### Services Overview

| Service | Description | Port |
|---------|-------------|------|
| ft_api | Backend API | 4001 |
| ft_game | Frontend SPA | 80 |
| ft_nginx | Reverse proxy (HTTPS) | 443, 80 |
| ft_prometheus | Metrics collection | 9090 |
| ft_grafana | Monitoring dashboards | 3000 |
| ft_alertmanager | Alert management | 9093 |

## Troubleshooting

### Common Issues

**1. "Missing/weak JWT_SECRET" error**

The API requires a JWT secret to be set.

```bash
# Create the .env file
cp apps/api/.env.example apps/api/.env
# Make sure JWT_SECRET is set in the file
```

**2. Frontend can't connect to API (registration/login fails)**

The frontend needs to know where the API is located.

```bash
# Create frontend .env
echo "VITE_API_BASE_URL=http://localhost:4001" > apps/game/.env
# Restart the dev server
```

**3. Port 4001 already in use**

Another process is using the API port.

```bash
# Kill process on port 4001
lsof -ti:4001 | xargs kill -9

# Or use local-only mode
pnpm run dev:local

# Or change port
PORT=4101 pnpm run dev:api
```

**4. Docker container won't start**

```bash
# Full reset
pnpm run rebuild

# Or manually
docker compose down -v --rmi local --remove-orphans
docker compose build --no-cache
docker compose up -d
```

**5. Teammates see empty database**

Docker volumes are local. Share a snapshot:

```bash
# Export (sender)
docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
  sh -c 'cd /data && tar czf /backup/games-data.tgz .'

# Import (receiver)
docker volume create ft_transcendence_games-data
docker run --rm -v ft_transcendence_games-data:/data -v "$PWD":/backup alpine \
  sh -c 'cd /data && tar xzf /backup/games-data.tgz'
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
