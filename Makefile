# === ft_transcendence Makefile ===

COMPOSE := docker compose
SERVICES := api game nginx
ALL_SERVICES := api game nginx prometheus grafana node-exporter alertmanager

# === Default ===
all: up-all

# === Setup: .env + TLS certs ===
setup: env certs
	@echo "✅ Setup complete. Next: make up"

# Copy apps/api/.env if missing
env:
	@if [ ! -f apps/api/.env ]; then \
		echo "📁 Creating apps/api/.env from .env.example..."; \
		cp apps/api/.env.example apps/api/.env; \
	else \
		echo "✅ apps/api/.env already exists."; \
	fi

# Generate self-signed certs for HTTPS if missing
certs:
	@mkdir -p nginx/certs
	@if [ ! -f nginx/certs/cert.pem ] || [ ! -f nginx/certs/key.pem ]; then \
		echo "🔐 Generating self-signed TLS certificates..."; \
		openssl req -x509 -newkey rsa:4096 -sha256 -days 365 \
			-nodes -keyout nginx/certs/key.pem -out nginx/certs/cert.pem \
			-subj "/C=US/ST=None/L=None/O=None/CN=localhost"; \
	else \
		echo "✅ TLS certs already exist."; \
	fi

# === Build (local TS -> dist, then images) ===
build: build-local build-images

build-local:
	@echo "📦 Installing deps and building local artifacts..."
	pnpm i
	pnpm -C packages/infra build
	pnpm -C apps/api build
	pnpm -C apps/game build
	# API загружает .env из dist/apps/api/.env — скопируем актуальный
	mkdir -p apps/api/dist/apps/api
	cp apps/api/.env apps/api/dist/apps/api/.env

build-images:
	@echo "🐳 Building Docker images..."
	$(COMPOSE) build $(SERVICES)

# === Up / Down ===
up: build
	$(COMPOSE) up -d $(SERVICES)
	@echo "🚀 Open: https://localhost:$${NGINX_PORT_HTTPS:-8443}"

down:
	$(COMPOSE) down
	@echo "🛑 App stopped."

rebuild:
	$(COMPOSE) down -v --remove-orphans --rmi local || true
	$(COMPOSE) build --no-cache $(SERVICES)
	$(COMPOSE) up -d $(SERVICES)
	@echo "🔁 App fully rebuilt and restarted at https://localhost"

# === Logs / Utils ===
logs:
	$(COMPOSE) logs -f --tail=200 $(SERVICES)

logs-api:
	$(COMPOSE) logs -f --tail=200 api

logs-nginx:
	$(COMPOSE) logs -f --tail=200 nginx

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans --rmi local || true
	docker system prune -af --volumes || true
	@echo "🧹 Project fully cleaned."

# === All services (including monitoring) ===
up-all: build
	$(COMPOSE) up -d $(ALL_SERVICES)
	@echo "🚀 Open: https://localhost:$${NGINX_PORT_HTTPS:-8443}"

logs-all:
	$(COMPOSE) logs -f --tail=200 $(ALL_SERVICES)

.PHONY: all setup env certs build build-local build-images up down rebuild logs logs-api logs-nginx logs-all ps clean up-all
