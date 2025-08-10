# cURL API Testing Examples

This document provides cURL commands to test all the Crypto Crash Game API endpoints.

## Base URL
```bash
export BASE_URL="http://localhost:3000"
# For production: export BASE_URL="https://your-backend-app.onrender.com"
```

## Health & Info Endpoints

### Health Check
```bash
curl -X GET "$BASE_URL/api/health"
```

### Ping
```bash
curl -X GET "$BASE_URL/api/ping"
```

### API Information
```bash
curl -X GET "$BASE_URL/api/info" | jq
```

## Game Endpoints

### Get Current Game State
```bash
curl -X GET "$BASE_URL/api/game/state" | jq
```

### Get Crypto Prices
```bash
curl -X GET "$BASE_URL/api/game/prices" | jq
```

### Get Round History
```bash
curl -X GET "$BASE_URL/api/game/history?limit=10" | jq
```

### Place a Bet
```bash
curl -X POST "$BASE_URL/api/game/bet" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "alice_crypto",
    "betAmountUsd": 5.00,
    "currency": "BTC"
  }' | jq
```

### Cash Out
```bash
curl -X POST "$BASE_URL/api/game/cashout" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "alice_crypto"
  }' | jq
```

## Player Endpoints

### Create New Player
```bash
curl -X POST "$BASE_URL/api/player" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test_player_$(date +%s)",
    "name": "Test Player",
    "initialBtcBalance": 0.001,
    "initialEthBalance": 0.1
  }' | jq
```

### Get Player Wallet
```bash
curl -X GET "$BASE_URL/api/player/alice_crypto/wallet" | jq
```

### Get Player Transaction History
```bash
curl -X GET "$BASE_URL/api/player/alice_crypto/history?limit=20" | jq
```

### Update Player Status
```bash
curl -X PUT "$BASE_URL/api/player/alice_crypto/status" \
  -H "Content-Type: application/json" \
  -d '{
    "isOnline": true
  }' | jq
```

### Get All Players
```bash
curl -X GET "$BASE_URL/api/player?limit=20&offset=0" | jq
```

## Demo Player IDs

Use these pre-seeded player IDs for testing:

- `alice_crypto` - Alice Cooper
- `bob_trader` - Bob Johnson  
- `charlie_whale` - Charlie Wilson
- `diana_lucky` - Diana Prince
- `eve_gamer` - Eve Adams

## Game Flow Testing

### 1. Complete Game Flow Test
```bash
#!/bin/bash

PLAYER_ID="alice_crypto"
echo "Testing complete game flow for player: $PLAYER_ID"

echo "1. Getting player wallet..."
curl -s "$BASE_URL/api/player/$PLAYER_ID/wallet" | jq '.data.wallets'

echo -e "\n2. Getting current game state..."
curl -s "$BASE_URL/api/game/state" | jq '.data.gameState'

echo -e "\n3. Placing a bet..."
curl -s -X POST "$BASE_URL/api/game/bet" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "'$PLAYER_ID'",
    "betAmountUsd": 2.50,
    "currency": "BTC"
  }' | jq '.success'

echo -e "\n4. Checking updated wallet..."
curl -s "$BASE_URL/api/player/$PLAYER_ID/wallet" | jq '.data.wallets.BTC'

echo -e "\n5. Getting transaction history..."
curl -s "$BASE_URL/api/player/$PLAYER_ID/history?limit=3" | jq '.data.transactions[0:2]'
```

### 2. Multiple Players Test
```bash
#!/bin/bash

PLAYERS=("alice_crypto" "bob_trader" "charlie_whale")

for player in "${PLAYERS[@]}"; do
  echo "Testing player: $player"
  
  # Place bet
  curl -s -X POST "$BASE_URL/api/game/bet" \
    -H "Content-Type: application/json" \
    -d '{
      "playerId": "'$player'",
      "betAmountUsd": '$((RANDOM % 20 + 1))',
      "currency": "BTC"
    }' | jq '.success'
    
  sleep 1
done
```

### 3. Error Testing
```bash
#!/bin/bash

echo "Testing invalid inputs..."

echo "1. Invalid player ID:"
curl -s -X POST "$BASE_URL/api/game/bet" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "nonexistent_player",
    "betAmountUsd": 5,
    "currency": "BTC"
  }' | jq '.message'

echo -e "\n2. Invalid bet amount:"
curl -s -X POST "$BASE_URL/api/game/bet" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "alice_crypto",
    "betAmountUsd": -5,
    "currency": "BTC"
  }' | jq '.errors'

echo -e "\n3. Invalid currency:"
curl -s -X POST "$BASE_URL/api/game/bet" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "alice_crypto",
    "betAmountUsd": 5,
    "currency": "INVALID"
  }' | jq '.errors'
```

## Rate Limiting Test

```bash
#!/bin/bash

echo "Testing rate limiting..."
for i in {1..15}; do
  echo "Request $i:"
  curl -s -X POST "$BASE_URL/api/game/bet" \
    -H "Content-Type: application/json" \
    -d '{
      "playerId": "alice_crypto",
      "betAmountUsd": 1,
      "currency": "BTC"
    }' | jq -r '.message // .success'
  sleep 0.1
done
```

## Performance Testing

### Response Time Test
```bash
#!/bin/bash

echo "Testing API response times..."

for endpoint in "health" "game/state" "game/prices" "player/alice_crypto/wallet"; do
  echo "Testing /$endpoint:"
  time curl -s "$BASE_URL/api/$endpoint" > /dev/null
  echo ""
done
```

### Load Test (Simple)
```bash
#!/bin/bash

echo "Simple load test - 50 concurrent health checks:"
for i in {1..50}; do
  curl -s "$BASE_URL/api/health" > /dev/null &
done
wait
echo "All requests completed"
```

## WebSocket Testing with curl-ws

If you have `curl` with WebSocket support:

```bash
# Connect to WebSocket
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     http://localhost:3000/socket.io/?EIO=4&transport=websocket
```

## Environment Variables for Testing

```bash
# Development
export BASE_URL="http://localhost:3000"

# Production
export BASE_URL="https://your-backend-app.onrender.com"

# With authentication (if implemented)
export API_KEY="your-api-key"
export AUTH_HEADER="Authorization: Bearer $API_KEY"
```

## Useful jq Filters

```bash
# Extract only essential game state info
curl -s "$BASE_URL/api/game/state" | jq '{
  gameState: .data.gameState,
  multiplier: .data.multiplier,
  roundId: .data.currentRound.roundId
}'

# Extract wallet balances only
curl -s "$BASE_URL/api/player/alice_crypto/wallet" | jq '{
  btc: .data.wallets.BTC.balance,
  eth: .data.wallets.ETH.balance,
  totalUsd: .data.totalUsdValue
}'

# Extract recent transactions
curl -s "$BASE_URL/api/player/alice_crypto/history" | jq '.data.transactions[] | {
  type: .type,
  amount: .amountUsd,
  currency: .currency,
  time: .createdAt
}'
```

## Monitoring Script

```bash
#!/bin/bash

# monitor.sh - Continuous monitoring script
while true; do
  clear
  echo "=== Crypto Crash Game Monitor ==="
  echo "Time: $(date)"
  echo ""
  
  echo "Game State:"
  curl -s "$BASE_URL/api/game/state" | jq '{
    state: .data.gameState,
    multiplier: .data.multiplier,
    round: .data.currentRound.roundId
  }'
  
  echo -e "\nCrypto Prices:"
  curl -s "$BASE_URL/api/game/prices" | jq '.data.prices'
  
  echo -e "\nActive Players:"
  curl -s "$BASE_URL/api/player" | jq '.data.players[] | select(.isOnline) | .playerId'
  
  sleep 5
done
```

Make the script executable and run:
```bash
chmod +x monitor.sh
./monitor.sh
```

