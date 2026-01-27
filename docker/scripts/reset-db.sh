#!/bin/bash
# =============================================================================
# Villages Database Reset Script
# WARNING: This will DELETE all data in the local database!
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")/../.."

echo ""
echo -e "${RED}============================================${NC}"
echo -e "${RED}  WARNING: Database Reset${NC}"
echo -e "${RED}============================================${NC}"
echo ""
echo -e "${YELLOW}This will DELETE all data in the local database!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r CONFIRM
echo ""

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted. No changes made."
    exit 0
fi

echo -e "${YELLOW}Dropping database...${NC}"
docker compose exec -T mongodb mongosh --quiet --eval "
  use villages-dev;
  db.dropDatabase();
  print('Database dropped successfully');
" 2>/dev/null || echo -e "${YELLOW}Database may not exist yet${NC}"

echo ""
echo -e "${GREEN}Re-seeding database...${NC}"
docker compose --profile seed up db-seed

echo ""
echo -e "${GREEN}Database reset complete!${NC}"
echo ""
echo "Start the app with: ./docker/scripts/start.sh dev"
echo ""
