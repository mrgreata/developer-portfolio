(() => {
  const key = "visitedOnce";

  // Wenn schon besucht: Overlay sofort weg
  if (sessionStorage.getItem(key) === "1") {
    document.body.classList.add("is-loaded");
    return;
  }

  // Beim ersten Besuch: kurz schwarz, dann ausfaden
  window.addEventListener("load", () => {
    // minimale Verzögerung, damit man das Schwarz wirklich sieht
    setTimeout(() => {
      document.body.classList.add("is-loaded");
      sessionStorage.setItem(key, "1");
    }, 120);
  });
})();
