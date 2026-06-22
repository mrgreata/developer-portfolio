(() => {
  // === ENDPOINT des Workers ===
  const ENDPOINT = "https://collect.marlongreta1.workers.dev";
  const SITE_ID = "portfolio-v1";

  const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function getStoredId(storage, key) {
    try {
      const existing = storage.getItem(key);
      if (existing) return existing;
      const next = makeId();
      storage.setItem(key, next);
      return next;
    } catch {
      return makeId();
    }
  }

  // Cookielose IDs (nur im Browser, nicht serverseitig)
  const sid = getStoredId(sessionStorage, "portfolio_sid");
  const vid = getStoredId(localStorage, "portfolio_vid");

  // Metriken
  let maxScroll = 0, timeMs = 0, last = performance.now();
  const milestones = [25, 50, 75, 90];   // Scroll-Events
  const hit = new Set();

  // Scrolltiefe messen
  addEventListener("scroll", () => {
    const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const pct = Math.min(100, Math.round(((scrollY + innerHeight) / docH) * 100));
    if (pct > maxScroll) maxScroll = pct;
    milestones.forEach(m => { if (pct >= m && !hit.has(m)) { hit.add(m); send(`scroll_${m}`); } });
  }, { passive: true });

  // Verweildauer (nur wenn Tab sichtbar)
  const loop = () => { if (!document.hidden) timeMs += performance.now() - last; last = performance.now(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  function buildPayload(kind = "pageview", extra = {}) {
    return {
      siteId: SITE_ID,
      kind,
      url: location.href,
      path: location.pathname,
      referrer: document.referrer || null,
      lang: navigator.language || null,
      timeOnPageSec: Math.round(timeMs / 1000),
      maxScroll,
      sid,
      vid,
      ts: new Date().toISOString(),
      viewport: `${innerWidth}x${innerHeight}`,
      ...extra,
    };
  }

  function sendWithBeacon(body) {
    try {
      return Boolean(navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" })));
    } catch {
      return false;
    }
  }

  // Sende-Funktion: fetch ist in Brave zuverlässiger; Beacon bleibt Fallback für Tab-Ende.
  function send(kind = "pageview", extra = {}, options = {}) {
    const body = JSON.stringify(buildPayload(kind, extra));

    if (options.preferBeacon && sendWithBeacon(body)) {
      return;
    }

    fetch(ENDPOINT, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "text/plain" },
      body,
    }).catch(() => {
      sendWithBeacon(body);
    });
  }

  // Pageview und Abschluss
  addEventListener("load", () => send("pageview"));
  let sentFinal = false;
  const sendFinalOnce = () => {
    if (sentFinal) return;
    sentFinal = true;
    send("final", {}, { preferBeacon: true });
  };

addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") sendFinalOnce();
});
addEventListener("pagehide", sendFinalOnce);


  // Optional: Beispiel-Klicktracking für deinen CTA
  // document.querySelectorAll('a.btn.primary[href^="mailto:"]').forEach(a => {
  //   a.addEventListener("click", () => send("click_cta"));
  // });

  addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (!el) return;

  const section = el.getAttribute("data-track");       // cta | nav | project | social
  const label   = el.getAttribute("data-label") || "";
  const ctx     = el.getAttribute("data-section") || "";

  const href = el.getAttribute("href") || "";
  const isOutbound = href.startsWith("http") && !href.includes(location.host);

  send("click", {
    eventSection: section,
    eventLabel: label,
    eventContext: ctx,
    isOutbound
  });
}, { capture: true });

})();
