const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCors(resp) {
  const h = new Headers(resp.headers);
  for (const [k, v] of Object.entries(corsHeaders)) h.set(k, v);
  return new Response(resp.body, { status: resp.status, headers: h });
}

export default {
  async fetch(req, env) {
    // Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Simple GET check
    if (req.method === "GET") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
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
        const errText = await supaResp.text();
        return withCors(new Response("supabase_error: " + errText, { status: 500 }));
      }

      return new Response("stored", { status: 200, headers: corsHeaders });
    } catch (e) {
      // Any unexpected crash still returns CORS
      return withCors(new Response("worker_error: " + (e?.message || String(e)), { status: 500 }));
    }
  },
};
