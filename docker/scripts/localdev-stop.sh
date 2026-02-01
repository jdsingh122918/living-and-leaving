#!/bin/bash
# =============================================================================
# Villages Local Dev - Stop & Cleanup
#
# Usage:
#   ./docker/scripts/localdev-stop.sh          # Stop containers (keep data)
#   ./docker/scripts/localdev-stop.sh clean    # Stop and remove all data
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$(dirname "$0")/../.."

PORT_STATE_FILE="$(pwd)/.docker-ports"

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Villages Local Dev - Cleanup${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

ACTION="${1:-stop}"

case $ACTION in
    stop)
        echo -e "${YELLOW}Stopping localdev containers...${NC}"
        docker compose --profile localdev down
        rm -f "$PORT_STATE_FILE"
        echo ""
        echo -e "${GREEN}Local dev environment stopped.${NC}"
        echo "  Data is preserved in Docker volumes."
        echo "  To remove all data: ./docker/scripts/localdev-stop.sh clean"
        ;;

    clean)
        echo -e "${RED}Stopping and removing localdev containers, volumes, and data...${NC}"
        echo ""
        docker compose --profile localdev down -v --remove-orphans
        rm -f "$PORT_STATE_FILE"
        echo ""
        echo -e "${GREEN}Cleanup complete.${NC}"
        echo "  All localdev data has been removed."
        echo "  Run ./docker/scripts/start.sh localdev to start fresh."
        ;;

    *)
        echo "Usage: ./docker/scripts/localdev-stop.sh [command]"
        echo ""
        echo "Commands:"
        echo "  stop    Stop containers, keep data (default)"
        echo "  clean   Stop containers and remove all data"
        exit 1
        ;;
esac

echo ""
