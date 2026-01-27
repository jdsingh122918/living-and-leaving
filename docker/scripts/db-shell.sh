#!/bin/bash
# =============================================================================
# Villages MongoDB Shell Access
# Opens an interactive MongoDB shell connected to villages-dev database
# =============================================================================

cd "$(dirname "$0")/../.."

echo "Opening MongoDB shell..."
echo "Connected to: villages-dev"
echo "Type 'exit' to quit"
echo ""

docker compose exec mongodb mongosh --quiet villages-dev
