const allowedOrigins = new Set([
  "https://marlongreta.at",
  "https://www.marlongreta.at",
  "https://mrgreata.github.io",
  "http://127.0.0.1:4174",
  "http://localhost:4174",
]);

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://marlongreta.at",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(req, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function textResponse(req, body, status = 200) {
  return new Response(body, { status, headers: corsHeaders(req) });
}

function clean(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanMultiline(value, maxLength) {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

async function readJson(req) {
  const contentType = req.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("unsupported_content_type");
  }

  const raw = await req.text();
  if (raw.length > 12000) {
    throw new Error("payload_too_large");
  }

  return JSON.parse(raw || "{}");
}

async function verifyTurnstile(req, env, token) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: req.headers.get("CF-Connecting-IP") || undefined,
    }),
  });

  if (!response.ok) return false;
  const result = await response.json();
  return Boolean(result.success);
}

async function handleContact(req, env) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { ok: false }, 405);
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return jsonResponse(req, { ok: false, error: "invalid_request" }, 400);
  }

  if (clean(body.website, 200)) {
    return jsonResponse(req, { ok: true });
  }

  const submission = {
    name: clean(body.name, 120),
    email: clean(body.email, 254),
    projectType: clean(body.projectType, 160),
    budget: clean(body.budget, 80),
    timeline: clean(body.timeline, 80),
    message: cleanMultiline(body.message, 4000),
    page: clean(body.page, 500),
    lang: clean(body.lang, 12) || "de",
    sentAt: clean(body.sentAt, 40),
  };

  if (
    submission.name.length < 2 ||
    !isValidEmail(submission.email) ||
    submission.projectType.length < 2 ||
    submission.message.length < 10
  ) {
    return jsonResponse(req, { ok: false, error: "validation_failed" }, 400);
  }

  const turnstileOk = await verifyTurnstile(req, env, clean(body.turnstileToken, 2048));
  if (!turnstileOk) {
    return jsonResponse(req, { ok: false, error: "verification_failed" }, 403);
  }

  const to = env.CONTACT_TO_EMAIL || "marlongreta1@gmail.com";
  const from = env.CONTACT_FROM_EMAIL || "Portfolio <contact@marlongreta.at>";
  const subject = `Neue Portfolio-Anfrage: ${submission.projectType}`;
  const text = [
    `Name: ${submission.name}`,
    `E-Mail: ${submission.email}`,
    `Projektart: ${submission.projectType}`,
    `Budgetrahmen: ${submission.budget || "-"}`,
    `Zeitraum: ${submission.timeline || "-"}`,
    `Sprache: ${submission.lang}`,
    `Seite: ${submission.page || "-"}`,
    "",
    submission.message,
  ].join("\n");
  const html = `
    <h2>Neue Portfolio-Anfrage</h2>
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
    <p><strong>E-Mail:</strong> ${escapeHtml(submission.email)}</p>
    <p><strong>Projektart:</strong> ${escapeHtml(submission.projectType)}</p>
    <p><strong>Budgetrahmen:</strong> ${escapeHtml(submission.budget || "-")}</p>
    <p><strong>Zeitraum:</strong> ${escapeHtml(submission.timeline || "-")}</p>
    <p><strong>Sprache:</strong> ${escapeHtml(submission.lang)}</p>
    <p><strong>Seite:</strong> ${escapeHtml(submission.page || "-")}</p>
    <hr>
    <p>${escapeHtml(submission.message).replace(/\n/g, "<br>")}</p>
  `;

  if (!env.RESEND_API_KEY) {
    return jsonResponse(req, { ok: false, error: "email_not_configured" }, 500);
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: submission.email,
      subject,
      text,
      html,
      tags: [
        { name: "source", value: "portfolio" },
        { name: "lang", value: submission.lang.replace(/[^a-zA-Z0-9_-]/g, "_") },
      ],
    }),
  });

  if (!emailResponse.ok) {
    return jsonResponse(req, { ok: false, error: "email_failed" }, 502);
  }

  return jsonResponse(req, { ok: true });
}

const trackingCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/contact") {
      return handleContact(req, env);
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: trackingCorsHeaders });
    }

    if (req.method === "GET") {
      return new Response("ok", { status: 200, headers: trackingCorsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("ok", { status: 200, headers: trackingCorsHeaders });
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
      return new Response("supabase_error: " + err, { status: 500, headers: trackingCorsHeaders });
    }

    return new Response("stored", { status: 200, headers: trackingCorsHeaders });
  }
};
