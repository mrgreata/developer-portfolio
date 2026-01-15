export default {
  async fetch(req, env, ctx) {

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }
    
    if (req.method !== "POST") return new Response("ok", { status: 200 });

    const cf = req.cf || {};
    let body = {};
    try { body = await req.json(); } catch {}

    const record = {
      site_id: body.siteId,
      kind: body.kind,
      url: body.url,
      path: body.path,
      referrer: body.referrer,
      lang: body.lang,
      time_on_page_sec: body.timeOnPageSec,
      max_scroll: body.maxScroll,
      country: cf.country,
      region: cf.region,
      city: cf.city,
      sid: body.sid || null,
      vid: body.vid || null,
      client_ts: body.ts || null,
      event_label: body.eventLabel || null,
      event_section: body.eventSection || null,
      event_context: body.eventContext || null,
      is_outbound: body.isOutbound ?? null
    };

    await fetch(env.SUPABASE_URL + "/rest/v1/visits", {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_KEY,
        "Authorization": "Bearer " + env.SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(record)
    });

    return new Response("stored", { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
  }
};
