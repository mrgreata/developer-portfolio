const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method === "GET") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // text/plain -> read as text, then JSON.parse
    let body = {};
    try {
      const raw = await req.text();
      body = JSON.parse(raw || "{}");
    } catch {}

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

    const supaResp = await fetch(env.SUPABASE_URL + "/rest/v1/visits", {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_KEY,
        "Authorization": "Bearer " + env.SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(record),
    });

    if (!supaResp.ok) {
      const err = await supaResp.text();
      return new Response("supabase_error: " + err, { status: 500, headers: corsHeaders });
    }

    return new Response("stored", { status: 200, headers: corsHeaders });
  }
};
