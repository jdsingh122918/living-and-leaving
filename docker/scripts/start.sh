#!/bin/bash
# =============================================================================
# Villages Docker Start Script
#
# Usage:
#   ./docker/scripts/start.sh dev       # Development with hot reload
#   ./docker/scripts/start.sh staging   # Production-like build
#   ./docker/scripts/start.sh webhooks  # Dev + ngrok for Clerk webhooks
#   ./docker/scripts/start.sh seed      # Seed database
#   ./docker/scripts/start.sh localdev   # Local dev without Clerk (test users)
#   ./docker/scripts/start.sh stop      # Stop all containers
#   ./docker/scripts/start.sh clean     # Stop and remove volumes
#   ./docker/scripts/start.sh logs      # View logs
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Change to project root
cd "$(dirname "$0")/../.."

# =============================================================================
# Port Management
# =============================================================================

PORT_STATE_FILE="$(pwd)/.docker-ports"
DEFAULT_APP_PORT=3000
DEFAULT_MONGO_PORT=27017
DEFAULT_NGROK_PORT=4040
PORT_SEARCH_RANGE=10

is_port_available() {
    local port=$1
    if command -v lsof &> /dev/null; then
        ! lsof -i ":$port" -sTCP:LISTEN &> /dev/null
    elif command -v nc &> /dev/null; then
        ! nc -z localhost "$port" 2>/dev/null
    else
        return 0  # Assume available if no tool
    fi
}

find_available_port() {
    local default_port=$1
    local service_name=$2
    local port=$default_port
    local max_port=$((default_port + PORT_SEARCH_RANGE))

    while [ $port -lt $max_port ]; do
        if is_port_available "$port"; then
            [ $port -ne $default_port ] && echo -e "${YELLOW}Port $default_port in use, using $port for $service_name${NC}" >&2
            echo "$port"
            return 0
        fi
        port=$((port + 1))
    done

    echo -e "${RED}Error: No available port for $service_name ($default_port-$max_port)${NC}" >&2
    return 1
}

resolve_ports() {
    APP_PORT=$(find_available_port $DEFAULT_APP_PORT "App") || return 1
    MONGO_PORT=$(find_available_port $DEFAULT_MONGO_PORT "MongoDB") || return 1
    NGROK_PORT=$(find_available_port $DEFAULT_NGROK_PORT "ngrok") || return 1
}

save_port_state() {
    cat > "$PORT_STATE_FILE" << EOF
VILLAGES_APP_PORT=$APP_PORT
VILLAGES_MONGO_PORT=$MONGO_PORT
VILLAGES_NGROK_PORT=$NGROK_PORT
VILLAGES_STARTED=$(date +%s)
EOF
}

load_port_state() {
    [ -f "$PORT_STATE_FILE" ] && source "$PORT_STATE_FILE"
}

clear_port_state() {
    rm -f "$PORT_STATE_FILE"
}

export_port_env() {
    export VILLAGES_APP_PORT=$APP_PORT
    export VILLAGES_MONGO_PORT=$MONGO_PORT
    export VILLAGES_NGROK_PORT=$NGROK_PORT
}

show_ports() {
    echo ""
    echo -e "${CYAN}Port Configuration:${NC}"
    echo "  Application:  http://localhost:$APP_PORT"
    echo "  MongoDB:      mongodb://localhost:$MONGO_PORT"
    [ "$1" = "webhooks" ] && echo "  ngrok UI:     http://localhost:$NGROK_PORT"
}

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

PROFILE="${1:-dev}"

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Villages Healthcare Platform${NC}"
echo -e "${CYAN}  Docker Environment${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

case $PROFILE in
    dev)
        echo -e "${GREEN}Starting development environment (hot reload)...${NC}"
        echo ""
        resolve_ports || exit 1
        export_port_env
        docker compose --profile dev up -d
        save_port_state
        echo ""
        echo -e "${GREEN}Development server started!${NC}"
        show_ports
        echo "  Database:     villages-dev"
        echo ""
        echo "Commands:"
        echo "  ./docker/scripts/start.sh logs     - View application logs"
        echo "  ./docker/scripts/start.sh seed     - Seed database"
        echo "  ./docker/scripts/start.sh stop     - Stop containers"
        echo "  ./docker/scripts/start.sh status   - Show container status and ports"
        ;;

    staging)
        echo -e "${GREEN}Starting staging environment (production-like)...${NC}"
        echo -e "${YELLOW}Note: This will rebuild the application container${NC}"
        echo ""
        resolve_ports || exit 1
        export_port_env
        docker compose --profile staging up -d --build
        save_port_state
        echo ""
        echo -e "${GREEN}Staging server started!${NC}"
        show_ports
        echo "  Memory Limit: 1024MB (matches Vercel Hobby plan)"
        echo "  Database:     villages-staging"
        ;;

    webhooks)
        echo -e "${GREEN}Starting development with ngrok webhooks...${NC}"
        echo ""

        if [ -z "$NGROK_AUTHTOKEN" ]; then
            echo -e "${YELLOW}Warning: NGROK_AUTHTOKEN not set${NC}"
            echo "  Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken"
            echo "  Add to .env.local: NGROK_AUTHTOKEN=your_token_here"
            echo ""
        fi

        resolve_ports || exit 1
        export_port_env
        docker compose --profile dev --profile webhooks up -d
        save_port_state
        echo ""
        echo -e "${GREEN}Development server with webhooks started!${NC}"
        show_ports "webhooks"
        echo ""
        echo "Waiting for ngrok tunnel..."
        sleep 5
        ./docker/scripts/ngrok-url.sh 2>/dev/null || echo -e "${YELLOW}ngrok may still be starting. Run: ./docker/scripts/ngrok-url.sh${NC}"
        ;;

    seed)
        echo -e "${GREEN}Running database seeder...${NC}"
        echo ""
        # Check if MongoDB is already running
        if docker ps --filter "name=villages-mongodb" --filter "status=running" --format "{{.Names}}" 2>/dev/null | grep -q "villages-mongodb"; then
            echo -e "${CYAN}Using existing MongoDB instance...${NC}"
            # Run seed without starting dependencies (MongoDB already running)
            docker compose run --rm --no-deps db-seed
        else
            echo -e "${CYAN}Starting MongoDB and seeding...${NC}"
            docker compose --profile seed up db-seed
        fi
        echo ""
        echo -e "${GREEN}Database seeding complete!${NC}"
        ;;

    localdev)
        echo -e "${GREEN}Starting local development environment (no Clerk required)...${NC}"
        echo ""
        resolve_ports || exit 1
        export_port_env

        # Start MongoDB + app with test mode
        docker compose --profile localdev up -d --build

        echo ""
        echo -e "${CYAN}Waiting for MongoDB to be ready...${NC}"
        # Wait for mongodb-init to complete
        docker compose wait villages-mongodb-init 2>/dev/null || sleep 10

        echo -e "${CYAN}Seeding test users and healthcare data...${NC}"
        # Run the seed service (it will exit when done)
        docker compose run --rm db-seed-users

        save_port_state
        echo ""
        echo -e "${GREEN}============================================${NC}"
        echo -e "${GREEN}  Local Development Environment Ready!${NC}"
        echo -e "${GREEN}============================================${NC}"
        echo ""
        echo -e "${CYAN}Application:${NC}  http://localhost:$APP_PORT"
        echo -e "${CYAN}Database:${NC}     villages-dev"
        echo ""
        echo -e "${CYAN}Test User Login URLs:${NC}"
        echo -e "  Admin:      ${GREEN}http://localhost:$APP_PORT/api/auth/test-login?user=test_admin_001${NC}"
        echo -e "  Volunteer:  ${GREEN}http://localhost:$APP_PORT/api/auth/test-login?user=test_volunteer_001${NC}"
        echo -e "  Member:     ${GREEN}http://localhost:$APP_PORT/api/auth/test-login?user=test_member_001${NC}"
        echo ""
        echo -e "  Logout:     http://localhost:$APP_PORT/api/auth/test-login?action=logout"
        echo ""
        echo "Commands:"
        echo "  ./docker/scripts/start.sh logs app-localdev  - View application logs"
        echo "  ./docker/scripts/start.sh stop               - Stop containers"
        echo "  ./docker/scripts/start.sh status             - Show container status"
        ;;

    stop)
        echo -e "${YELLOW}Stopping all containers...${NC}"
        docker compose --profile dev --profile staging --profile webhooks --profile localdev down
        clear_port_state
        echo ""
        echo -e "${GREEN}All containers stopped.${NC}"
        echo "  Data is preserved in Docker volumes."
        echo "  To remove all data: ./docker/scripts/start.sh clean"
        ;;

    clean)
        echo -e "${RED}Stopping and removing all containers and volumes...${NC}"
        docker compose --profile dev --profile staging --profile webhooks --profile localdev down -v --remove-orphans
        clear_port_state
        echo ""
        echo -e "${GREEN}Cleanup complete.${NC}"
        echo "  All data has been removed."
        ;;

    logs)
        SERVICE="${2:-app}"
        echo "Showing logs for ${SERVICE}..."
        echo "Press Ctrl+C to exit"
        echo ""
        docker compose logs -f "$SERVICE"
        ;;

    status)
        echo "Container Status:"
        echo ""
        docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
        if [ -f "$PORT_STATE_FILE" ]; then
            load_port_state
            echo ""
            echo -e "${CYAN}Configured Ports:${NC}"
            echo "  App:     http://localhost:${VILLAGES_APP_PORT:-3000}"
            echo "  MongoDB: mongodb://localhost:${VILLAGES_MONGO_PORT:-27017}"
            [ -n "$VILLAGES_NGROK_PORT" ] && echo "  ngrok:   http://localhost:$VILLAGES_NGROK_PORT"
        fi
        ;;

    *)
        echo "Usage: ./docker/scripts/start.sh <command>"
        echo ""
        echo "Commands:"
        echo "  dev       Start development environment with hot reload"
        echo "  staging   Start staging environment (production-like build)"
        echo "  webhooks  Start development with ngrok for Clerk webhooks"
        echo "  seed      Seed the database with healthcare tags"
        echo "  localdev   Start local dev without Clerk (uses test users)"
        echo "  stop      Stop all containers (preserves data)"
        echo "  clean     Stop containers and remove all data"
        echo "  logs      View logs (optional: specify service name)"
        echo "  status    Show container status"
        echo ""
        echo "Examples:"
        echo "  ./docker/scripts/start.sh dev"
        echo "  ./docker/scripts/start.sh localdev"
        echo "  ./docker/scripts/start.sh logs mongodb"
        exit 1
        ;;
esac

echo ""
