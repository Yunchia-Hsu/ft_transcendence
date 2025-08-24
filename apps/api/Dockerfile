FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy root package.json, lockfile, and workspace file
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy infra and API package.json (so pnpm can resolve dependencies)
COPY packages/infra/package.json ./packages/infra/
COPY apps/api/package.json ./apps/api/

# Install all dependencies in the workspace
RUN pnpm install --frozen-lockfile --workspace-root

# Copy the rest of the code
COPY apps ./apps
COPY packages ./packages

# Ensure DB folder exists
RUN mkdir -p packages/infra/db

# Expose API port
EXPOSE 4001

WORKDIR /app/apps/api

CMD ["pnpm", "dev"]
