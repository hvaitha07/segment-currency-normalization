/**
 * Insert Function: Normalize monetary amounts to USD, add revenue_usd/fx_rate/fx_as_of,
 * handle Stripe minor units and zero-decimal currencies, and preserve originals.
 *
 * Settings:
 * - apiKey:        exchangeratesapi.io key
 * - sourceMinor:   true|false  (true if source uses minor units like Stripe cents)
 * - zeroDecimals:  CSV of zero-decimal currencies
 * - baseCurrency:  USD (this implementation targets USD for clarity)
 */

const ZERO_DEC_DEFAULT = "BIF,CLP,DJF,GNF,JPY,KMF,KRW,PYG,RWF,UGX,VND,VUV,XAF,XOF,XPF"
  .split(",").map(s => s.trim().toUpperCase());

function isZeroDecimal(ccy, zeroList) {
  return zeroList.includes((ccy || "").toUpperCase());
}

function toMajorUnits(amount, currency, zeroList, sourceMinor) {
  if (!sourceMinor) return amount;
  if (isZeroDecimal(currency, zeroList)) return amount;
  return amount / 100;
}

function bankersRound2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function fetchFxRatesUSD(settings) {
  const endpoint = `https://api.exchangeratesapi.io/v1/latest?access_key=${settings.apiKey}&format=1`;
  let resp;
  try {
    resp = await fetch(endpoint, { method: "GET" });
  } catch (err) {
    throw new RetryError(`FX fetch connection error: ${String(err)}`);
  }
  if (resp.status >= 500 || resp.status === 429) {
    throw new RetryError(`FX fetch retryable status: ${resp.status}`);
  }
  const data = await resp.json();
  if (!data || !data.rates || typeof data.rates !== "object") {
    throw new Error("Invalid FX API response structure.");
  }
  return data.rates;
}

function computeToUsdRate(rates, fromCcy) {
  const USD = "USD";
  if (fromCcy === USD) return 1;
  const eurToUsd = rates[USD];
  const eurToFrom = rates[fromCcy];
  if (!eurToUsd) throw new Error("USD rate missing in FX response.");
  if (!eurToFrom) throw new Error(`FX rate missing for ${fromCcy} in response.`);
  return eurToUsd / eurToFrom;
}

async function onTrack(event, settings) {
  const base = (settings.baseCurrency || "USD").toUpperCase();
  if (base !== "USD") {
    throw new Error("This function currently supports baseCurrency = USD only.");
  }

  const zeroList = (settings.zeroDecimals || ZERO_DEC_DEFAULT).split(",").map(s => s.trim().toUpperCase());
  const sourceMinor = !!settings.sourceMinor;

  const props = event.properties || {};
  const revenue = props.revenue ?? props.amount ?? props.amount_total ?? null;
  const currency = (props.currency || props.currency_code || "USD").toUpperCase();

  if (revenue == null || isNaN(Number(revenue))) {
    return event;
  }

  if (props.revenue_usd != null && props.fx_rate != null) {
    return event;
  }

  const major = toMajorUnits(Number(revenue), currency, zeroList, sourceMinor);

  let fxRate = 1;
  let revenueUSD = major;

  if (currency !== "USD") {
    const rates = await fetchFxRatesUSD(settings);
    fxRate = computeToUsdRate(rates, currency);
    revenueUSD = bankersRound2(major * fxRate);
  }

  event.properties = {
    ...props,
    original_amount: major,
    original_currency: currency,
    revenue_usd: revenueUSD,
    fx_rate: fxRate,
    fx_base: "USD",
    fx_as_of: new Date().toISOString()
  };

  return event;
}
