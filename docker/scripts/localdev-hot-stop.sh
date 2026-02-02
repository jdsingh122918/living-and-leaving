#!/bin/bash
# =============================================================================
# Villages Local Dev Hot Reload - Stop & Cleanup
#
# Usage:
#   ./docker/scripts/localdev-hot-stop.sh          # Stop MongoDB (keep data)
#   ./docker/scripts/localdev-hot-stop.sh clean    # Stop and remove all data
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$(dirname "$0")/../.."

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Villages Hot Reload Dev - Cleanup${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

ACTION="${1:-stop}"

case $ACTION in
    stop)
        echo -e "${YELLOW}Stopping MongoDB containers...${NC}"
        docker compose stop mongodb mongodb-init
        docker compose rm -f mongodb-init 2>/dev/null || true
        echo ""
        echo -e "${GREEN}MongoDB stopped.${NC}"
        echo "  Data is preserved in Docker volumes."
        echo "  To remove all data: ./docker/scripts/localdev-hot-stop.sh clean"
        ;;

    clean)
        echo -e "${RED}Stopping MongoDB and removing all data...${NC}"
        echo ""
        docker compose stop mongodb mongodb-init
        docker compose rm -f mongodb mongodb-init 2>/dev/null || true
        docker volume rm villages-mongodb-data 2>/dev/null || true
        echo ""
        echo -e "${GREEN}Cleanup complete.${NC}"
        echo "  MongoDB data has been removed."
        echo "  Run 'make localdev-hot' to start fresh."
        ;;

    *)
        echo "Usage: ./docker/scripts/localdev-hot-stop.sh [command]"
        echo ""
        echo "Commands:"
        echo "  stop    Stop MongoDB, keep data (default)"
        echo "  clean   Stop MongoDB and remove all data"
        exit 1
        ;;
esac

echo ""
