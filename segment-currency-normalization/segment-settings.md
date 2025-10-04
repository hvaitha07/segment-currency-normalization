# Segment Settings

## Source Function
- Deploy `src/source/onRequest.js`
- Copy the **public HTTPS endpoint** for testing.
- (Optional) Add a simple auth header check if you need.

## Insert Function
Add the following **Settings** keys in the Segment UI:
- `apiKey` — exchangeratesapi.io key (required)
- `sourceMinor` — `true` if your source provides **minor units** (e.g., Stripe cents); else `false`
- `zeroDecimals` — `BIF,CLP,DJF,GNF,JPY,KMF,KRW,PYG,RWF,UGX,VND,VUV,XAF,XOF,XPF`
- `baseCurrency` — `USD`

## Destination Function
Add the following **Settings** keys in the Segment UI:
- `mode` — `amplitude` or `webhook`
- `amplitudeApiKey` — required if `mode=amplitude`
- `webhookUrl` — required if `mode=webhook`

> Tip: Start with `mode=webhook` and point to a RequestBin/Pipedream URL to observe the enriched events.
