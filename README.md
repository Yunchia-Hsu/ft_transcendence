# Pong Game - ft_transcendence

A full-featured online Pong game platform with real-time multiplayer, tournaments, friends system, and two-factor authentication.

## Demo

[![Watch the demo](https://img.youtube.com/vi/DNij0lZR4IU/maxresdefault.jpg)](https://youtu.be/DNij0lZR4IU)

*Click the image above to watch the demo video*

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
| Frontend | React 19, Vite 7, Tailwind CSS |
| Backend | Hono.js, TypeScript |
| Database | SQLite|
| DevOps | Docker, Nginx, Grafana |
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
git clone https://github.com/Yunchia-Hsu/ft_transcendence.git
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

For full interactive documentation, visit **Swagger UI**: http://localhost:4001/ui

### Testing the API

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

## License

MIT License

