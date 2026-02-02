#!/bin/bash
# =============================================================================
# Prisma Schema Watcher
#
# Watches prisma/schema.prisma for changes and auto-runs `prisma generate`.
# Uses Node.js fs.watch (no new dependencies) with 500ms debounce.
#
# Usage:
#   ./docker/scripts/watch-prisma.sh          # Run in foreground
#   ./docker/scripts/watch-prisma.sh &        # Run in background
# =============================================================================

cd "$(dirname "$0")/../.."

SCHEMA_FILE="$(pwd)/prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "[prisma-watcher] Error: schema.prisma not found at $SCHEMA_FILE"
    exit 1
fi

echo "[prisma-watcher] Watching $SCHEMA_FILE for changes..."

# Note: execSync here runs a hardcoded command (npx prisma generate) with no
# user-supplied input. This is a local dev-only script, not a production path.
node -e "
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const schemaPath = process.argv[1];
let timer = null;

fs.watch(schemaPath, () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString();
        console.log('[prisma-watcher] Schema changed, regenerating... (' + timestamp + ')');
        try {
            execSync('npx prisma generate', {
                stdio: 'inherit',
                cwd: path.dirname(path.dirname(schemaPath))
            });
            console.log('[prisma-watcher] Done. Watching for changes...');
        } catch (err) {
            console.error('[prisma-watcher] prisma generate failed:', err.message);
        }
    }, 500);
});

// Keep process alive
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
" "$SCHEMA_FILE"
