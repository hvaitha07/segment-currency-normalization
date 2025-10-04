/**
 * Source Function: Accepts realistic JSON payment events via HTTP and emits Segment events.
 */
async function onRequest(request, settings) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body || !body.event || !(body.userId || body.anonymousId)) {
    return new Response("Missing required fields: event and userId/anonymousId", { status: 400 });
  }

  Segment.track({
    event: body.event,
    userId: body.userId,
    anonymousId: body.anonymousId,
    timestamp: body.timestamp,
    properties: body.properties || {},
    context: body.context || {}
  });

  if (body.identify && body.identify.userId) {
    Segment.identify({
      userId: body.identify.userId,
      traits: body.identify.traits || {}
    });
  }

  return new Response("OK", { status: 200 });
}
