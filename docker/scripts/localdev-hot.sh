#!/bin/bash
# =============================================================================
# Villages Local Dev - Hot Reload Mode
#
# Runs MongoDB in Docker, Next.js natively on the host for instant HMR.
#
# Usage:
#   ./docker/scripts/localdev-hot.sh
#   make localdev-hot
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$(dirname "$0")/../.."
PROJECT_ROOT="$(pwd)"

WATCHER_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    if [ -n "$WATCHER_PID" ] && kill -0 "$WATCHER_PID" 2>/dev/null; then
        kill "$WATCHER_PID" 2>/dev/null || true
        wait "$WATCHER_PID" 2>/dev/null || true
        echo -e "  ${GREEN}Prisma watcher stopped${NC}"
    fi
    echo -e "  ${CYAN}MongoDB left running. Stop with: make localdev-hot-stop${NC}"
    echo ""
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Villages Local Dev - Hot Reload Mode${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# =============================================================================
# Phase 1: Preflight checks
# =============================================================================
echo -e "${CYAN}[Phase 1/5] Preflight checks...${NC}"

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${RED}Error: node_modules not found. Run 'npm install' first.${NC}"
    exit 1
fi

if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo -e "${RED}Error: .env.local not found. Copy from .env.example or create one.${NC}"
    exit 1
fi

# Check if port 3000 is available
if command -v lsof &>/dev/null && lsof -i :3000 -sTCP:LISTEN &>/dev/null; then
    echo -e "${RED}Error: Port 3000 is already in use.${NC}"
    echo "  Run: lsof -i :3000  to see what's using it."
    exit 1
fi

echo -e "  ${GREEN}Preflight OK${NC}"
echo ""

# =============================================================================
# Phase 2: Start MongoDB in Docker
# =============================================================================
echo -e "${CYAN}[Phase 2/5] Starting MongoDB in Docker...${NC}"

# Start only mongodb + mongodb-init (no app containers)
docker compose up -d mongodb mongodb-init

# Wait for mongodb-init to finish (replica set initialization)
echo -e "  Waiting for replica set initialization..."
docker compose wait villages-mongodb-init 2>/dev/null || sleep 10

# Verify MongoDB is reachable from host
if ! docker exec villages-mongodb mongosh --eval "rs.status().ok" --quiet 2>/dev/null; then
    echo -e "${YELLOW}  Waiting for MongoDB to accept connections...${NC}"
    for i in $(seq 1 15); do
        if docker exec villages-mongodb mongosh --eval "rs.status().ok" --quiet 2>/dev/null; then
            break
        fi
        sleep 2
    done
fi

echo -e "  ${GREEN}MongoDB ready on localhost:27017${NC}"
echo ""

# =============================================================================
# Phase 3: Prisma generate + db push on host
# =============================================================================
echo -e "${CYAN}[Phase 3/5] Prisma generate + schema push...${NC}"

# Override env vars for test mode on the host
export DATABASE_URL="mongodb://localhost:27017/living-leaving-test?retryWrites=true&w=majority&replicaSet=rs0&directConnection=true"
export INTEGRATION_TEST_MODE=true
export NEXT_PUBLIC_INTEGRATION_TEST_MODE=true
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_localdev_placeholder
export CLERK_SECRET_KEY=sk_test_localdev_placeholder
export CLERK_WEBHOOK_SECRET=whsec_localdev_placeholder

npx prisma generate
npx prisma db push --skip-generate

echo -e "  ${GREEN}Prisma ready${NC}"
echo ""

# =============================================================================
# Phase 4: Seed test data on host
# =============================================================================
echo -e "${CYAN}[Phase 4/5] Seeding test data...${NC}"

echo "  [1/2] Seeding test users..."
npx tsx scripts/seed-test-users.ts

echo "  [2/2] Seeding healthcare directive..."
npx tsx scripts/seed-healthcare-directive.ts

echo -e "  ${GREEN}Seed data ready${NC}"
echo ""

# =============================================================================
# Phase 5: Start Prisma watcher + Next.js
# =============================================================================
echo -e "${CYAN}[Phase 5/5] Starting development servers...${NC}"

# Start Prisma schema watcher in background
"$PROJECT_ROOT/docker/scripts/watch-prisma.sh" &
WATCHER_PID=$!
echo -e "  Prisma watcher started (PID $WATCHER_PID)"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Hot Reload Dev Environment Ready!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}Application:${NC}  http://localhost:3000"
echo -e "${CYAN}Database:${NC}     mongodb://localhost:27017/living-leaving-test"
echo ""
echo -e "${CYAN}Test User Login URLs:${NC}"
echo -e "  Admin:      ${GREEN}http://localhost:3000/api/auth/test-login?user=test_admin_001${NC}"
echo -e "  Volunteer:  ${GREEN}http://localhost:3000/api/auth/test-login?user=test_volunteer_001${NC}"
echo -e "  Member:     ${GREEN}http://localhost:3000/api/auth/test-login?user=test_member_001${NC}"
echo ""
echo -e "  Logout:     http://localhost:3000/api/auth/test-login?action=logout"
echo ""
echo -e "${CYAN}Ctrl+C stops Next.js + watcher. MongoDB stays running.${NC}"
echo -e "${CYAN}Full teardown: make localdev-hot-stop${NC}"
echo ""

# Start Next.js in foreground
npx next dev
