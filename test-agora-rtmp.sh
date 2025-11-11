#!/bin/bash

# Test Agora RTMP Streaming API
# This script helps you test the Agora RTMP streaming endpoint

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Agora RTMP Streaming API Test ===${NC}\n"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Check required variables
if [ -z "$AGORA_APP_ID" ]; then
    echo -e "${RED}Error: AGORA_APP_ID not set in .env${NC}"
    exit 1
fi

if [ -z "$AGORA_APP_CERTIFICATE" ]; then
    echo -e "${RED}Error: AGORA_APP_CERTIFICATE not set in .env${NC}"
    exit 1
fi

if [ -z "$AGORA_REST_API_CUSTOMER_ID" ]; then
    echo -e "${RED}Error: AGORA_REST_API_CUSTOMER_ID not set in .env${NC}"
    exit 1
fi

if [ -z "$AGORA_REST_API_CUSTOMER_SECRET" ]; then
    echo -e "${RED}Error: AGORA_REST_API_CUSTOMER_SECRET not set in .env${NC}"
    exit 1
fi

# Configuration
APP_ID="$AGORA_APP_ID"
CUSTOMER_ID="$AGORA_REST_API_CUSTOMER_ID"
CUSTOMER_SECRET="$AGORA_REST_API_CUSTOMER_SECRET"
CHANNEL_NAME="test_channel_$(date +%s)"
UID="123456"
RTMP_URL="${RTMP_SERVER_URL:-rtmp://localhost:1935/live}/test"

echo -e "${GREEN}Configuration:${NC}"
echo "  App ID: $APP_ID"
echo "  Customer ID: $CUSTOMER_ID"
echo "  Channel Name: $CHANNEL_NAME"
echo "  UID: $UID"
echo "  RTMP URL: $RTMP_URL"
echo ""

# Generate RTC Token using Node.js
echo -e "${YELLOW}Generating RTC Token...${NC}"

TOKEN=$(node -e "
const pkg = require('agora-access-token');
const { RtcTokenBuilder, RtcRole } = pkg;

const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;
const channelName = '$CHANNEL_NAME';
const account = 'test_user_$UID';
const role = RtcRole.PUBLISHER;
const expirationTimeInSeconds = 3600;

const currentTimestamp = Math.floor(Date.now() / 1000);
const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

const token = RtcTokenBuilder.buildTokenWithAccount(
  appId,
  appCertificate,
  channelName,
  account,
  role,
  privilegeExpiredTs
);

console.log(token);
")

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Failed to generate token${NC}"
    exit 1
fi

echo -e "${GREEN}Token generated successfully${NC}"
echo ""

# Prepare request body
REQUEST_BODY=$(cat <<EOF
{
  "cname": "$CHANNEL_NAME",
  "uid": "$UID",
  "clientRequest": {
    "token": "$TOKEN",
    "videoStreamType": 1,
    "outputStreamConfig": {
      "outputStreamUrl": "$RTMP_URL"
    }
  }
}
EOF
)

echo -e "${YELLOW}Request Body:${NC}"
echo "$REQUEST_BODY" | jq '.' 2>/dev/null || echo "$REQUEST_BODY"
echo ""

# Make the API request
echo -e "${YELLOW}Making API request...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.agora.io/v1/apps/$APP_ID/rtsc/single-stream/start" \
  -u "$CUSTOMER_ID:$CUSTOMER_SECRET" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Split response and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}Response:${NC}"
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Success!${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    
    # Extract stream ID if available
    STREAM_ID=$(echo "$BODY" | jq -r '.streamId // .data.streamId // .id // empty' 2>/dev/null)
    if [ -n "$STREAM_ID" ]; then
        echo ""
        echo -e "${GREEN}Stream ID: $STREAM_ID${NC}"
        echo ""
        echo -e "${YELLOW}To stop the stream, run:${NC}"
        echo "curl -X POST \"https://api.agora.io/v1/apps/$APP_ID/rtsc/single-stream/stop\" \\"
        echo "  -u \"$CUSTOMER_ID:$CUSTOMER_SECRET\" \\"
        echo "  -H \"Content-Type: application/json\" \\"
        echo "  -d '{\"streamId\": \"$STREAM_ID\"}'"
    fi
else
    echo -e "${RED}❌ Error!${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Check if Media Gateway is enabled in Agora Console"
    echo "2. Verify REST API credentials are correct"
    echo "3. Verify App ID matches your project"
    echo "4. Check if RTMP server is running at: $RTMP_URL"
fi

