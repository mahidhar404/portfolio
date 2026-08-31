# Common tasks. Run `make` with no arguments to see them all.

.DEFAULT_GOAL := help
.PHONY: help install dev dev-backend dev-frontend seed reset-db superuser \
        token gen-api test test-backend test-frontend e2e lint typecheck \
        check format build docker-up docker-down clean schema

help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install backend and frontend dependencies
	cd backend && uv sync
	cd frontend && pnpm install

dev: ## Print how to run both dev servers
	@echo "Run these in two terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"
	@echo ""
	@echo "Then open http://localhost:5173"

dev-backend: ## Run the Django dev server on :8000
	cd backend && uv run python manage.py runserver 8000

dev-frontend: ## Run the Vite dev server on :5173
	cd frontend && pnpm dev

seed: ## Fill the database with the demo persona
	cd backend && uv run python manage.py migrate && uv run python manage.py seed_demo

reset-db: ## Delete the local database and reseed from scratch
	rm -f backend/db.sqlite3
	rm -rf backend/media
	cd backend && uv run python manage.py migrate && uv run python manage.py seed_demo

superuser: ## Create an admin login for /admin/
	cd backend && uv run python manage.py createsuperuser

token: ## Print an API token for the Swagger "Authorize" button
	@cd backend && uv run python manage.py shell -c "\
from django.contrib.auth import get_user_model; \
from rest_framework.authtoken.models import Token; \
u = get_user_model().objects.filter(is_superuser=True).first(); \
print('No superuser yet — run: make superuser') if u is None else \
print('Token', Token.objects.get_or_create(user=u)[0].key)"

gen-api: ## Regenerate the frontend API types from the Django models
	cd frontend && pnpm run gen:api

schema: ## Write docs/resume.schema.json from the Python definition
	cd backend && uv run python manage.py export_resume_schema

test: test-backend test-frontend ## Run every unit and integration test

test-backend: ## Run the Django test suite
	cd backend && uv run pytest

test-frontend: ## Run the Vitest suite
	cd frontend && pnpm run test

e2e: ## Run Playwright against a seeded backend and a production build
	cd backend && uv run python manage.py migrate && uv run python manage.py seed_demo --no-images
	cd frontend && VITE_API_URL=http://127.0.0.1:8000 pnpm run build:only
	cd backend && CONTACT_THROTTLE_RATE=1000/hour uv run python manage.py runserver 8000 & \
		sleep 4; cd frontend && VITE_API_URL=http://127.0.0.1:8000 pnpm exec playwright test; \
		status=$$?; pkill -f "manage.py runserver" || true; exit $$status

lint: ## Lint both halves
	cd backend && uv run ruff check .
	cd frontend && pnpm run lint

typecheck: ## Type-check both halves
	cd backend && uv run mypy portfolio config tests
	cd frontend && pnpm exec tsc -b --noEmit

format: ## Auto-format both halves
	cd backend && uv run ruff check --fix .
	cd frontend && pnpm run format

check: lint typecheck test ## Everything CI runs, minus E2E

build: ## Production build of the frontend
	cd frontend && pnpm run build:only

docker-up: ## Run the whole stack (Postgres + API + frontend) in Docker
	docker compose up --build

docker-down: ## Stop the Docker stack and remove its volumes
	docker compose down -v

clean: ## Remove build artefacts and caches
	rm -rf frontend/dist frontend/coverage frontend/playwright-report frontend/test-results
	rm -rf backend/htmlcov backend/.coverage backend/staticfiles
	find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -prune -exec rm -rf {} + 2>/dev/null || true
