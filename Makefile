# Villages Makefile
# Local Development & E2E Test Commands

.PHONY: localdev localdev-stop localdev-clean localdev-logs localdev-status localdev-seed
.PHONY: localdev-hot localdev-hot-stop localdev-hot-clean
.PHONY: dev staging seed stop clean logs status
.PHONY: test-smoke test-e2e test-e2e-parallel test-e2e-shard test-e2e-ui test-e2e-report clean-e2e help

# Default target
help:
	@echo ""
	@echo "Local Development (no Clerk required):"
	@echo "  make localdev       - Start local dev environment with test users and healthcare directive"
	@echo "  make localdev-stop  - Stop local dev (keep data)"
	@echo "  make localdev-clean - Stop local dev and remove all data"
	@echo "  make localdev-logs  - Tail application logs"
	@echo "  make localdev-seed  - Re-seed test users and healthcare directive"
	@echo "  make localdev-status - Show container status"
	@echo ""
	@echo "Hot Reload (MongoDB in Docker, Next.js on host):"
	@echo "  make localdev-hot       - Start hot-reload dev (instant HMR)"
	@echo "  make localdev-hot-stop  - Stop MongoDB (keep data)"
	@echo "  make localdev-hot-clean - Stop MongoDB and remove all data"
	@echo ""
	@echo "Docker (requires Clerk keys in .env.local):"
	@echo "  make dev            - Start dev environment with hot reload"
	@echo "  make staging        - Start staging environment"
	@echo "  make seed           - Seed healthcare tags"
	@echo "  make stop           - Stop all containers"
	@echo "  make clean          - Stop all containers and remove data"
	@echo "  make logs           - Tail application logs"
	@echo "  make status         - Show container status"
	@echo ""
	@echo "E2E Tests:"
	@echo "  make test-smoke        - Run smoke tests (~3-5 min, critical path only)"
	@echo "  make test-e2e          - Run full test suite (sequential, stable)"
	@echo "  make test-e2e-parallel - Run full test suite (4 workers, experimental)"
	@echo "  make test-e2e-shard    - Run sharded tests for CI (usage: make test-e2e-shard SHARD=1/4)"
	@echo "  make test-e2e-ui       - Run tests in interactive UI mode"
	@echo "  make test-e2e-report   - Open HTML test report"
	@echo "  make clean-e2e         - Clean up E2E test resources"

# =============================================================================
# Local Development (no Clerk required)
# =============================================================================

# Start local dev: MongoDB + app + test users, no Clerk keys needed
localdev:
	./docker/scripts/start.sh localdev

# Stop local dev containers (data preserved in volumes)
localdev-stop:
	./docker/scripts/localdev-stop.sh

# Stop local dev and remove all data
localdev-clean:
	./docker/scripts/localdev-stop.sh clean

# Tail local dev application logs
localdev-logs:
	./docker/scripts/start.sh logs app-localdev

# Show container status and ports
localdev-status:
	./docker/scripts/start.sh status

# Re-seed test users into a running localdev environment
localdev-seed:
	docker compose run --rm db-seed-users

# =============================================================================
# Hot Reload (MongoDB in Docker, Next.js on host for instant HMR)
# =============================================================================

# Start hot-reload dev: MongoDB in Docker, Next.js on host
localdev-hot:
	./docker/scripts/localdev-hot.sh

# Stop MongoDB containers (data preserved in volumes)
localdev-hot-stop:
	./docker/scripts/localdev-hot-stop.sh

# Stop MongoDB and remove all data
localdev-hot-clean:
	./docker/scripts/localdev-hot-stop.sh clean

# =============================================================================
# Docker (requires Clerk keys)
# =============================================================================

dev:
	./docker/scripts/start.sh dev

staging:
	./docker/scripts/start.sh staging

seed:
	./docker/scripts/start.sh seed

stop:
	./docker/scripts/start.sh stop

clean:
	./docker/scripts/start.sh clean

logs:
	./docker/scripts/start.sh logs

status:
	./docker/scripts/start.sh status

# =============================================================================
# E2E Tests
# =============================================================================

# Quick smoke tests (~3-5 min) - critical path validation
# Tests auth, dashboards, and core features load correctly
test-smoke:
	npx playwright test --config=e2e/playwright.config.ts --grep @smoke

# Full test suite - sequential (stable, 1 worker)
# Recommended for CI and reliable test runs
test-e2e:
	npx playwright test --config=e2e/playwright.config.ts

# Full test suite - parallel (experimental, may have race conditions)
# Faster local runs but may have issues with shared MongoDB state
test-e2e-parallel:
	npx playwright test --config=e2e/playwright.config.ts --workers=4

# CI sharding (run subset of tests on each CI node)
# Usage: make test-e2e-shard SHARD=1/4
# Example CI matrix: SHARD=1/4, SHARD=2/4, SHARD=3/4, SHARD=4/4
SHARD ?= 1/1
test-e2e-shard:
	npx playwright test --config=e2e/playwright.config.ts --shard=$(SHARD)

# Interactive UI mode for debugging
test-e2e-ui:
	npx playwright test --config=e2e/playwright.config.ts --ui

# Open HTML test report
test-e2e-report:
	npx playwright show-report e2e/playwright-report

# Clean up E2E test resources
# Use this after failed test runs or to free up resources
clean-e2e:
	@echo "🧹 Cleaning up E2E test resources..."
	@-pkill -f "next dev" 2>/dev/null || true
	@-docker ps -q --filter "label=org.testcontainers=true" | xargs -r docker stop 2>/dev/null || true
	@-rm -f e2e/.testcontainer-config.json 2>/dev/null || true
	@-rm -f .env.e2e 2>/dev/null || true
	@-rm -f .env.local.backup 2>/dev/null || true
	@echo "✅ E2E cleanup complete"
