# Multi-Currency Revenue Normalization with Segment Functions

A production-style demo showing how to **ingest realistic JSON payment events**, **normalize multi-currency amounts to USD** using an **Insert Function**, and **forward enriched events** to analytics or webhooks using a **Destination Function** — all inside Segment.

> **Why this exists:** Teams often receive revenue events in CAD/GBP/USD and struggle to report apples-to-apples across regions. This repo demonstrates a clean, serverless approach to normalizing currency using Segment Functions.

---

## 🧱 Repository Structure

```
segment-currency-normalization/
├─ src/
│  ├─ source/
│  │  └─ onRequest.js        # Source Function: accepts realistic JSON events via HTTP
│  ├─ insert/
│  │  └─ onTrack.js          # Insert Function: converts revenue to USD (adds revenue_usd, fx_rate, fx_as_of)
│  └─ destination/
│     └─ onTrack.js          # Destination Function: forwards events to Amplitude or a webhook
├─ sample_payloads/
│  ├─ subscription_payment_gbp.json
│  ├─ subscription_payment_cad_minor_units.json
│  └─ subscription_payment_usd.json
├─ curl_examples.sh          # Handy curl commands for testing
├─ segment-settings.md       # What to configure in Segment UI
├─ .gitignore
├─ LICENSE
└─ README.md
```

---

## 🚀 Quick Start

> This project runs **inside Segment Functions** (no local server needed). You’ll paste each file’s content into the corresponding function in the Segment UI.

1. **Create a Source Function** in Segment and paste `src/source/onRequest.js`.
2. **Create an Insert Function** and paste `src/insert/onTrack.js`.
3. **Create a Destination Function** and paste `src/destination/onTrack.js`.
4. Use the provided **curl commands** to POST realistic JSON payloads to your Source Function endpoint.
5. Watch the **Insert Function** enrich events with `revenue_usd` and FX metadata.
6. Send enriched events to **Amplitude** or a **webhook** via the Destination Function.

---

## ⚙️ Environment / Settings

You will configure these in the **Segment Functions UI** (not via `.env`).

**Insert Function settings:**
- `apiKey`: your exchangeratesapi.io API key
- `sourceMinor`: `true` if your source sends **minor units** (e.g., Stripe cents), otherwise `false`
- `zeroDecimals`: `BIF,CLP,DJF,GNF,JPY,KMF,KRW,PYG,RWF,UGX,VND,VUV,XAF,XOF,XPF`
- `baseCurrency`: `USD`

**Destination Function settings:**
- `mode`: `amplitude` or `webhook`
- If `amplitude`: set `amplitudeApiKey`
- If `webhook`: set `webhookUrl`

> Note: Many FX APIs default to **EUR base**. This repo computes cross-rates so you can always derive **from-currency → USD**.

---

## 🧪 Testing with cURL

After deploying the **Source Function**, copy its HTTPS endpoint and run:

```bash
bash curl_examples.sh "https://YOUR-SOURCE-FUNCTION-ENDPOINT"
```

This will POST three realistic events (GBP, CAD minor units, USD) to your Source Function, which emits them into Segment → Insert Function (FX normalization) → Destination.

---

## 📈 What You’ll See

Each event gets enriched with:

```json
{
  "revenue_usd": 36.94,
  "fx_rate": 0.739,
  "fx_base": "USD",
  "fx_as_of": "2025-10-04T12:00:00Z",
  "original_amount": 49.99,
  "original_currency": "GBP"
}
```

Dashboards/warehouses will then show **consistent USD revenue** across all geographies.

---

## 🔍 Notes & Considerations

- **Idempotency:** Insert Function skips re-conversion if `revenue_usd` already exists.
- **Stripe minor units:** Set `sourceMinor=true` so `1299` (cents) becomes `12.99` dollars; **zero-decimal currencies** (JPY, KRW, etc.) are handled correctly.
- **Reliability:** 5xx and 429 responses from the FX API trigger `RetryError`, so Segment retries safely.
- **Auditing:** We preserve `original_amount` and `original_currency` for traceability.
- **Extensibility:** Change `baseCurrency` from USD if you extend the math (current code focuses on USD for clarity).

---

## 📄 License

MIT — see [LICENSE](./LICENSE).

---

## 🙌 Credits

 Structure and code designed for clarity, reliability, and real-world alignment.
