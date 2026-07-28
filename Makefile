.PHONY: run build down test amb install lint format

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