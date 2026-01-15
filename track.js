(() => {
  // === ENDPOINT des Workers ===
  const ENDPOINT = "https://portfolio-tracker.marlongreta1.workers.dev";
  const SITE_ID = "portfolio-v1";

  // Cookielose IDs (nur im Browser, nicht serverseitig)
  const sid = sessionStorage.sid || (sessionStorage.sid = (crypto.randomUUID?.() ?? Date.now()+"-"+Math.random()));
  const vid = localStorage.vid  || (localStorage.vid  = (crypto.randomUUID?.() ?? Date.now()+"-"+Math.random()));

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

  // Sende-Funktion (sendBeacon bevorzugt)
  function send(kind="pageview") {
    const payload = {
      siteId: SITE_ID, kind,
      url: location.href, path: location.pathname,
      referrer: document.referrer || null, lang: navigator.language || null,
      timeOnPageSec: Math.round(timeMs/1000), maxScroll,
      sid, vid, ts: new Date().toISOString()
    };
    const body = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (!navigator.sendBeacon || !navigator.sendBeacon(ENDPOINT, body)) {
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body }).catch(()=>{});
    }
  }

  // Pageview und Abschluss
  addEventListener("load", () => send("pageview"));
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") send("final"); });
  addEventListener("pagehide", () => send("final"));

  // Optional: Beispiel-Klicktracking für deinen CTA
  // document.querySelectorAll('a.btn.primary[href^="mailto:"]').forEach(a => {
  //   a.addEventListener("click", () => send("click_cta"));
  // });
})();
