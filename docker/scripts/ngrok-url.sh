#!/bin/bash
# =============================================================================
# Villages ngrok URL Helper
# Displays the public URL for Clerk webhook configuration
# =============================================================================

# Load port state if available
SCRIPT_DIR="$(dirname "$0")"
PORT_STATE_FILE="$SCRIPT_DIR/../../.docker-ports"
NGROK_PORT=4040
[ -f "$PORT_STATE_FILE" ] && source "$PORT_STATE_FILE" && NGROK_PORT=${VILLAGES_NGROK_PORT:-4040}

URL=$(curl -s "http://localhost:$NGROK_PORT/api/tunnels" 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$URL" ]; then
    echo ""
    echo "ngrok is not running or no tunnel found."
    echo ""
    echo "Start with webhooks enabled:"
    echo "  ./docker/scripts/start.sh webhooks"
    echo ""
    exit 1
fi

echo ""
echo "============================================"
echo "  ngrok Webhook Configuration"
echo "============================================"
echo ""
echo "ngrok Public URL:"
echo "  ${URL}"
echo ""
echo "Clerk Webhook URL (copy this):"
echo "  ${URL}/api/webhooks/clerk"
echo ""
echo "Configure this URL in your Clerk dashboard:"
echo "  https://dashboard.clerk.com -> Webhooks -> Add Endpoint"
echo ""
echo "ngrok Inspection Dashboard:"
echo "  http://localhost:$NGROK_PORT"
echo ""
