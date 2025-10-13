# apps/api/Dockerfile
FROM node:20-alpine

# для bcrypt/better-sqlite3/sqlite3
RUN apk add --no-cache python3 make g++ libc6-compat && npm i -g pnpm

WORKDIR /app

# только манифесты (для prod deps)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/infra/package.json ./packages/infra/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# ставим ТОЛЬКО runtime-зависимости по воркспейсу
RUN pnpm install --prod --frozen-lockfile --workspace-root

# копируем уже СОБРАННЫЕ артефакты
# (ты их собрал на шаге 1)
COPY apps/api/dist ./apps/api/dist
COPY packages/infra/dist ./packages/infra/dist

# (если у тебя .env лежит в apps/api/.env и код грузит его из dist/apps/api/.env)
COPY apps/api/.env ./apps/api/dist/apps/api/.env

WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV PORT=4001
ENV DB_DIR=/app/data

EXPOSE 4001
CMD ["node","dist/apps/api/src/index.js"]
