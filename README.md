Absolutely! Here's an updated version of your README with **Docker instructions** and a **curl/Postman test example** included:

---

# ft_transcendence

## Project Overview

This project is built with **TurboRepo** for managing multiple packages, **TypeScript** for development, and **Hono** for API development. It includes an API with Swagger UI integration for easy testing and documentation.

## Requirements

- **Node.js** (>= 18)
- **pnpm** (v9.0.0)
- **Docker & Docker Compose** (for containerized development)

## Setup

1. **Clone the repository**:

   ```bash
   git clone <your-repo-url>
   cd ft_transcendence
   ```

2. **Install dependencies**:
   Install all dependencies using `pnpm` (the package manager used in this project):

   ```bash
   pnpm install
   ```

3. **Run the API locally**:
   To run the API server locally (without Docker):

   ```bash
   pnpm run dev:api
   ```

   The API server will start on `http://localhost:4001`.

4. **Run the full development environment**:
   If you want to run all services and tasks in the repo (like building, linting, etc.), run:

   ```bash
   pnpm run dev
   ```

## Docker Setup

You can also run the API using **Docker** for a fully isolated environment.

1. **Build the Docker image**:

   ```bash
   docker-compose build --no-cache
   ```

2. **Start the API container**:

   ```bash
   docker-compose up
   ```

   You should see:

   ```
   DB folder exists: /app/apps/api/packages/infra/db
   Server running at http://localhost:4001
   ```

3. **Stop the container**:

   ```bash
   docker-compose down
   ```

Docker ensures consistent behavior across machines and avoids local dependency conflicts.

## Testing the API

You can test API endpoints using **curl** or **Postman**.

### Example: Start a game

**Endpoint**: `POST http://localhost:4001/api/games/start`

#### Using curl:

```bash
curl -X POST http://localhost:4001/api/games/start \
  -H "Content-Type: application/json" \
  -d '{"player1": "Alice", "player2": "Bob"}'
```

#### Using Postman:

1. Open Postman.
2. Create a new `POST` request.
3. Set the URL to `http://localhost:4001/api/games/start`.
4. In the **Body** tab, select **raw → JSON** and enter:

```json
{
  "player1": "Alice",
  "player2": "Bob"
}
```

5. Send the request. You should receive a JSON response confirming the game start.

## Available Scripts

- **`pnpm run dev`**: Starts the development environment, running all tasks defined in your TurboRepo setup.
- **`pnpm run dev:game`**: Runs the game.
- **`pnpm run dev:api`**: Runs the API server locally.
- **`pnpm run build`**: Builds the project (used for production builds).
- **`pnpm run lint`**: Runs the linter across all packages.
- **`pnpm run format`**: Formats code with Prettier.
- **`pnpm run check-types`**: Runs TypeScript type checking.

## API Documentation

- The **API** runs on `http://localhost:4001/doc`.
- You can access the **Swagger UI** at `http://localhost:4001/ui` to view the API documentation and interact with the endpoints.
