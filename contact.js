(function () {
  const forms = document.querySelectorAll("[data-contact-form]");
  let turnstileScriptRequested = false;

  function requestTurnstileScript() {
    if (turnstileScriptRequested || window.turnstile) return;
    turnstileScriptRequested = true;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  function prepareTurnstile(form) {
    const sitekey = form.getAttribute("data-turnstile-sitekey");
    if (!sitekey || form.querySelector(".cf-turnstile")) return;

    const widget = document.createElement("div");
    widget.className = "cf-turnstile";
    widget.setAttribute("data-sitekey", sitekey);
    widget.setAttribute("data-theme", "dark");
    form.querySelector('button[type="submit"]')?.before(widget);
    requestTurnstileScript();
  }

  function getMessage(form, key) {
    const isEnglish = document.documentElement.lang === "en" || form.closest("html")?.lang === "en";
    const messages = {
      sending: isEnglish ? "Sending..." : "Wird gesendet...",
      success: isEnglish
        ? "Thanks, your inquiry was sent successfully."
        : "Danke, deine Anfrage wurde erfolgreich gesendet.",
      error: isEnglish
        ? "Something went wrong. Please try again or email me directly."
        : "Etwas ist schiefgelaufen. Bitte versuche es erneut oder schreib mir direkt per E-Mail.",
      invalid: isEnglish
        ? "Please check the highlighted fields."
        : "Bitte prüfe die markierten Felder.",
    };
    return messages[key];
  }

  function setStatus(form, type, text) {
    const status = form.querySelector("[data-contact-status]");
    if (!status) return;
    status.textContent = text;
    status.classList.remove("success", "error");
    if (type) status.classList.add(type);
  }

  function payloadFromForm(form) {
    const data = new FormData(form);
    return {
      name: String(data.get("Name") || "").trim(),
      email: String(data.get("E-Mail") || data.get("Email") || "").trim(),
      projectType: String(data.get("Projektart") || data.get("Project type") || "").trim(),
      budget: String(data.get("Budgetrahmen") || "").trim(),
      timeline: String(data.get("Zeitraum") || "").trim(),
      message: String(data.get("Nachricht") || data.get("Message") || "").trim(),
      website: String(data.get("Website") || "").trim(),
      page: window.location.href,
      lang: document.documentElement.lang || "de",
      sentAt: new Date().toISOString(),
      turnstileToken: String(data.get("cf-turnstile-response") || "").trim(),
    };
  }

  forms.forEach((form) => {
    prepareTurnstile(form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        setStatus(form, "error", getMessage(form, "invalid"));
        return;
      }

      const endpoint = form.getAttribute("data-contact-endpoint");
      const button = form.querySelector('button[type="submit"]');
      const originalButtonText = button?.textContent;

      if (!endpoint) {
        setStatus(form, "error", getMessage(form, "error"));
        return;
      }

      try {
        if (button) {
          button.disabled = true;
          button.textContent = getMessage(form, "sending");
        }
        setStatus(form, null, getMessage(form, "sending"));

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadFromForm(form)),
        });

        if (!response.ok) throw new Error("contact_submit_failed");

        form.reset();
        setStatus(form, "success", getMessage(form, "success"));

        if (window.turnstile) {
          window.turnstile.reset();
        }
      } catch (error) {
        setStatus(form, "error", getMessage(form, "error"));
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalButtonText;
        }
      }
    });
  });
})();
