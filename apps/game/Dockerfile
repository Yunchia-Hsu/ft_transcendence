FROM node:20-alpine AS builder

WORKDIR /app

# Copy only manifest files first (to leverage Docker cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/game/package.json ./apps/game/
COPY packages/types/package.json ./packages/types/

# Install dependencies for the whole monorepo (Turborepo)
RUN npm install -g pnpm && pnpm install --frozen-lockfile --workspace-root

# Copy source code
COPY apps ./apps
COPY packages ./packages

# Build the frontend
WORKDIR /app/apps/game
RUN pnpm build

# ---

# Production image: serve static files using nginx
FROM nginx:alpine AS production

# Copy built frontend from previous stage
COPY --from=builder /app/apps/game/dist /usr/share/nginx/html
COPY nginx/game.conf /etc/nginx/conf.d/default.conf

# Optional: replace default nginx config if needed
# COPY ./nginx/game.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
