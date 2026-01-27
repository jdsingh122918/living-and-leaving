#!/bin/bash
# Start dev server with DATABASE_URL from testcontainer config

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$SCRIPT_DIR/.testcontainer-config.json"

cd "$PROJECT_DIR"

if [ -f "$CONFIG_FILE" ]; then
  export DATABASE_URL=$(node -e "console.log(require('$CONFIG_FILE').connectionUri)")
  echo "🧪 Using test database: $DATABASE_URL"
else
  echo "⚠️ Config file not found: $CONFIG_FILE"
fi

export INTEGRATION_TEST_MODE=true
echo "🧪 INTEGRATION_TEST_MODE=$INTEGRATION_TEST_MODE"

npm run dev
