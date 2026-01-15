const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(req, env) {
    // 1) Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2) Health check
    if (req.method !== "POST") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // 3) Parse body
    let body = {};
    try { body = await req.json(); } catch {}

    const cf = req.cf || {};

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
      is_outbound: body.isOutbound ?? null,
    };

    // 4) Store in Supabase (and always return CORS headers)
    const resp = await fetch(env.SUPABASE_URL + "/rest/v1/visits", {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_KEY,
        "Authorization": "Bearer " + env.SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(record),
    });

    if (!resp.ok) {
      // helpful debug (still with CORS)
      const errText = await resp.text();
      return new Response("supabase_error: " + errText, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response("stored", { status: 200, headers: corsHeaders });
  },
};
