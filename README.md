# ft_transcendence

## Project Overview

This project is built with **TurboRepo** for managing multiple packages, **TypeScript** for development, and **Hono** for API development. It includes an API with Swagger UI integration for easy testing and documentation.

## Requirements

- **Node.js** (>= 18)
- **pnpm** (v9.0.0)

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

3. **Run the API**:
   To run the API server, use the following command:

   ```bash
   pnpm run dev:api
   ```

   This will start the API server on `http://localhost:4001`.

4. **Run the full development environment**:
   If you want to run all services and tasks in the repo (like building, linting, etc.), run:

   ```bash
   pnpm run dev
   ```

## Available Scripts

- **`pnpm run dev`**: Starts the development environment, running all tasks defined in your TurboRepo setup.
- **`pnpm run dev:game`**: Runs the game.
- **`pnpm run dev:api`**: Runs the API server locally.
- **`pnpm run build`**: Builds the project (used for production builds).
- **`pnpm run lint`**: Runs the linter across all packages.
- **`pnpm run format`**: Formats code with Prettier.
- **`pnpm run check-types`**: Runs TypeScript type checking.

## API Documentation

- The **API** runs on `http://localhost:4001/hello`.
- You can access the **Swagger UI** at `http://localhost:4001/ui` to view the API documentation and interact with the endpoints.
