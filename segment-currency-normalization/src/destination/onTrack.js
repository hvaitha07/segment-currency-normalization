/**
 * Destination Function: Forward enriched events to Amplitude or a generic webhook.
 *
 * Settings:
 * - mode:             'amplitude' | 'webhook'
 * - amplitudeApiKey:  required if mode='amplitude'
 * - webhookUrl:       required if mode='webhook'
 */

async function postToAmplitude(event, settings) {
  const url = "https://api2.amplitude.com/2/httpapi";

  const out = {
    api_key: settings.amplitudeApiKey,
    events: [
      {
        user_id: event.userId || undefined,
        device_id: event.anonymousId || undefined,
        event_type: event.event || "Track",
        time: event.timestamp ? new Date(event.timestamp).getTime() : Date.now(),
        event_properties: event.properties || {},
        user_properties: event.context?.traits || {}
      }
    ]
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(out)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Amplitude HTTP ${resp.status}: ${txt}`);
  }
}

async function postToWebhook(event, settings) {
  const url = settings.webhookUrl;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Webhook HTTP ${resp.status}: ${txt}`);
  }
}

async function onTrack(event, settings) {
  const mode = (settings.mode || "webhook").toLowerCase();

  if (mode === "amplitude") {
    if (!settings.amplitudeApiKey) throw new Error("Missing amplitudeApiKey in settings.");
    await postToAmplitude(event, settings);
    return;
  }

  if (mode === "webhook") {
    if (!settings.webhookUrl) throw new Error("Missing webhookUrl in settings.");
    await postToWebhook(event, settings);
    return;
  }

  throw new Error(`Unsupported mode: ${settings.mode}`);
}
