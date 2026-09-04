.PHONY: run build down test amb install lint format app-up app-down app-status

VENV_PATH ?= .venv
VENV_BIN := $(VENV_PATH)/bin
API_PORT ?= 8020
FRONTEND_PORT ?= 3000
API_RELOAD ?= --reload
API_PID_FILE := .api.pid
FRONTEND_PID_FILE := .frontend.pid

# Cria o ambiente virtual com Python 3
amb:
	python3 -m venv env

# Instala dependências usando o pip do ambiente virtual diretamente
install:
	./env/bin/pip install --upgrade pip
	./env/bin/pip install -r requirements.txt

# Docker Compose moderno (Plugin CLI v2 - sem hífen)
build:
	docker compose build

run:
	docker compose up -d

down:
	docker compose down

# Suíte de testes com o pytest do venv
test:
	PYTHONPATH=. ./env/bin/pytest tests/

# Linter e Formatação moderna rápida com Ruff
lint:
	./env/bin/ruff check src/

format:
	./env/bin/ruff format src/

# Sobe tudo localmente: Postgres (Docker), API (Uvicorn) e Frontend (Next.js)
app-up:
	docker compose up -d db
	@if [ ! -x "$(VENV_BIN)/uvicorn" ]; then \
		echo "Erro: uvicorn nao encontrado em $(VENV_BIN). Ative/crie o venv em $(VENV_PATH)."; \
		exit 1; \
	fi
	@if [ -f "$(API_PID_FILE)" ] && kill -0 $$(cat "$(API_PID_FILE)") 2>/dev/null; then \
		echo "API ja esta rodando (PID $$(cat $(API_PID_FILE)))."; \
	else \
		cd . && \
		DATABASE_URL=postgresql://finance_user:finance_password@localhost:5433/finance_db \
		SECRET_KEY=carteira-digital-local-secret-key \
		ACCESS_TOKEN_EXPIRE_MINUTES=43200 \
		setsid nohup "$(VENV_BIN)/uvicorn" src.main:app --host 0.0.0.0 --port $(API_PORT) $(API_RELOAD) > /tmp/carteira-api.log 2>&1 & \
		pid=$$!; \
		echo $$pid > "$(API_PID_FILE)"; \
		sleep 2; \
		if kill -0 $$pid 2>/dev/null; then \
			echo "API iniciada em http://localhost:$(API_PORT) (PID $$pid)."; \
		else \
			echo "Falha ao iniciar API. Verifique /tmp/carteira-api.log"; \
			exit 1; \
		fi; \
	fi
	@if [ -f "$(FRONTEND_PID_FILE)" ] && kill -0 $$(cat "$(FRONTEND_PID_FILE)") 2>/dev/null; then \
		echo "Frontend ja esta rodando (PID $$(cat $(FRONTEND_PID_FILE)))."; \
	else \
		setsid nohup /usr/bin/env bash -c 'cd finance-frontend && NEXT_PUBLIC_API_URL=http://localhost:$(API_PORT) npm run dev -- --port $(FRONTEND_PORT)' > /tmp/carteira-frontend.log 2>&1 & \
		pid=$$!; \
		echo $$pid > "$(FRONTEND_PID_FILE)"; \
		sleep 2; \
		if kill -0 $$pid 2>/dev/null; then \
			echo "Frontend iniciado em http://localhost:$(FRONTEND_PORT) (PID $$pid)."; \
		else \
			echo "Falha ao iniciar frontend. Verifique /tmp/carteira-frontend.log"; \
			exit 1; \
		fi; \
	fi
	@echo "\nAplicacao iniciada."
	@echo "Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "API docs: http://localhost:$(API_PORT)/docs"
	@echo "Logs: /tmp/carteira-frontend.log e /tmp/carteira-api.log"

# Para API e frontend locais e desliga o Postgres do compose
app-down:
	@if [ -f "$(API_PID_FILE)" ]; then \
		kill $$(cat "$(API_PID_FILE)") 2>/dev/null || true; \
		rm -f "$(API_PID_FILE)"; \
		echo "API parada."; \
	else \
		echo "API nao estava em execucao."; \
	fi
	@if [ -f "$(FRONTEND_PID_FILE)" ]; then \
		kill $$(cat "$(FRONTEND_PID_FILE)") 2>/dev/null || true; \
		rm -f "$(FRONTEND_PID_FILE)"; \
		echo "Frontend parado."; \
	else \
		echo "Frontend nao estava em execucao."; \
	fi
	docker compose stop db

# Mostra estado dos processos e container do Postgres
app-status:
	@echo "=== API ==="
	@if [ -f "$(API_PID_FILE)" ] && kill -0 $$(cat "$(API_PID_FILE)") 2>/dev/null; then \
		echo "Rodando (PID $$(cat $(API_PID_FILE)))."; \
	else \
		echo "Parada."; \
	fi
	@echo "=== Frontend ==="
	@if [ -f "$(FRONTEND_PID_FILE)" ] && kill -0 $$(cat "$(FRONTEND_PID_FILE)") 2>/dev/null; then \
		echo "Rodando (PID $$(cat $(FRONTEND_PID_FILE)))."; \
	else \
		echo "Parado."; \
	fi
	@echo "=== Docker DB ==="
	@docker compose ps db