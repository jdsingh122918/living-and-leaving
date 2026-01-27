# Villages Makefile
# E2E Test Commands with parallelism support

.PHONY: test-smoke test-e2e test-e2e-parallel test-e2e-shard test-e2e-ui test-e2e-report clean-e2e help

# Default target
help:
	@echo "Available targets:"
	@echo "  test-smoke        - Run smoke tests (~3-5 min, critical path only)"
	@echo "  test-e2e          - Run full test suite (sequential, stable)"
	@echo "  test-e2e-parallel - Run full test suite (4 workers, experimental)"
	@echo "  test-e2e-shard    - Run sharded tests for CI (usage: make test-e2e-shard SHARD=1/4)"
	@echo "  test-e2e-ui       - Run tests in interactive UI mode"
	@echo "  test-e2e-report   - Open HTML test report"
	@echo "  clean-e2e         - Clean up E2E test resources (processes, containers, files)"

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
