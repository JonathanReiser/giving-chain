#!/usr/bin/env bash
# Reads the latest broadcast JSON and writes contract addresses into frontend/.env.local
# Usage: bash script/update-frontend-env.sh

set -euo pipefail

BROADCAST_FILE="broadcast/Deploy.s.sol/84532/run-latest.json"

if [ ! -f "$BROADCAST_FILE" ]; then
  echo "Error: broadcast file not found at $BROADCAST_FILE"
  echo "Run the deploy script first."
  exit 1
fi

extract() {
  # $1 = contract name, output = deployed address
  python3 -c "
import json, sys
with open('$BROADCAST_FILE') as f:
    data = json.load(f)
for tx in data['transactions']:
    if tx.get('contractName') == '$1' and tx.get('transactionType') == 'CREATE':
        print(tx['contractAddress'])
        sys.exit(0)
print('NOT_FOUND')
sys.exit(1)
"
}

VENDOR_REG=$(extract VendorRegistry)
RECIPIENT_REG=$(extract RecipientRegistry)
NEED_REG=$(extract NeedRegistry)
ESCROW=$(extract DonationEscrow)

echo "Deployed addresses:"
echo "  VendorRegistry:    $VENDOR_REG"
echo "  RecipientRegistry: $RECIPIENT_REG"
echo "  NeedRegistry:      $NEED_REG"
echo "  DonationEscrow:    $ESCROW"

ENV_FILE="frontend/.env.local"

# Update each address in-place
sed -i '' "s|NEXT_PUBLIC_VENDOR_REGISTRY_ADDRESS=.*|NEXT_PUBLIC_VENDOR_REGISTRY_ADDRESS=$VENDOR_REG|" "$ENV_FILE"
sed -i '' "s|NEXT_PUBLIC_RECIPIENT_REGISTRY_ADDRESS=.*|NEXT_PUBLIC_RECIPIENT_REGISTRY_ADDRESS=$RECIPIENT_REG|" "$ENV_FILE"
sed -i '' "s|NEXT_PUBLIC_NEED_REGISTRY_ADDRESS=.*|NEXT_PUBLIC_NEED_REGISTRY_ADDRESS=$NEED_REG|" "$ENV_FILE"
sed -i '' "s|NEXT_PUBLIC_DONATION_ESCROW_ADDRESS=.*|NEXT_PUBLIC_DONATION_ESCROW_ADDRESS=$ESCROW|" "$ENV_FILE"

echo ""
echo "frontend/.env.local updated. Restart 'npm run dev' to pick up new addresses."
