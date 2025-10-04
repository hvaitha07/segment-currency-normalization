#!/usr/bin/env bash
# Usage: bash curl_examples.sh https://YOUR-SOURCE-FUNCTION-ENDPOINT
set -euo pipefail

ENDPOINT="${1:-}"
if [ -z "$ENDPOINT" ]; then
  echo "Provide the Source Function endpoint as the first argument."
  echo "Example: bash curl_examples.sh https://example.segment-functions.com/ingest"
  exit 1
fi

echo "[1/3] Posting GBP event ..."
curl -sS -X POST "$ENDPOINT" -H "Content-Type: application/json" -d @sample_payloads/subscription_payment_gbp.json
echo -e "\n"

echo "[2/3] Posting CAD minor-units (Stripe-like) event ..."
curl -sS -X POST "$ENDPOINT" -H "Content-Type: application/json" -d @sample_payloads/subscription_payment_cad_minor_units.json
echo -e "\n"

echo "[3/3] Posting USD event ..."
curl -sS -X POST "$ENDPOINT" -H "Content-Type: application/json" -d @sample_payloads/subscription_payment_usd.json
echo -e "\n"

echo "Done."
