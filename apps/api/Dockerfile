FROM node:20-alpine

RUN npm install -g pnpm
WORKDIR /app

# Manifests (enable caching & workspace linking)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/infra/package.json ./packages/infra/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --workspace-root

# Source
COPY apps ./apps
COPY packages ./packages

RUN mkdir -p packages/infra/db

EXPOSE 4001
WORKDIR /app/apps/api
CMD ["pnpm", "dev"]   # tsx --watch, so .ts is fine

