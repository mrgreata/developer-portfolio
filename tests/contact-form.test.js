const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const contactScript = fs.readFileSync(path.join(__dirname, "..", "contact.js"), "utf8");

function createClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    contains: (name) => values.has(name),
    toArray: () => [...values],
  };
}

function createButton(text = "Anfrage senden") {
  return {
    disabled: false,
    textContent: text,
    before() {},
  };
}

function createStatus() {
  return {
    querySelector() { return null; },
    textContent: "",
    classList: createClassList(),
  };
}

function createForm({
  endpoint = "https://collect.marlongreta1.workers.dev/contact",
  fields = {},
  valid = true,
  lang = "de",
  buttonText = "Anfrage senden",
} = {}) {
  const listeners = {};
  const button = createButton(buttonText);
  const status = createStatus();

  return {
    fields,
    resetCalled: false,
    getAttribute(name) {
      if (name === "data-contact-endpoint") return endpoint;
      if (name === "data-turnstile-sitekey") return null;
      return null;
    },
    querySelector(selector) {
      if (selector === 'button[type="submit"]') return button;
      if (selector === "[data-contact-status]") return status;
      if (selector === ".cf-turnstile") return null;
      return null;
    },
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    closest(selector) {
      if (selector === "html") return { lang };
      return null;
    },
    reportValidity() {
      return valid;
    },
    reset() {
      this.resetCalled = true;
    },
    async submit() {
      assert.equal(typeof listeners.submit, "function", "submit listener was not registered");
      const event = {
        prevented: false,
        preventDefault() {
          this.prevented = true;
        },
      };
      await listeners.submit(event);
      return event;
    },
    button,
    status,
  };
}

function loadContactScript({ forms, fetchImpl, lang = "de" }) {
  const context = {
    Date,
    Error,
    JSON,
    String,
    FormData: class FakeFormData {
      constructor(form) {
        this.form = form;
      }

      get(name) {
        return this.form.fields[name] ?? "";
      }
    },
    document: {
      documentElement: { lang },
      head: { appendChild() {} },
      createElement(tagName) {
        return {
          tagName,
          setAttribute(name, value) {
            this[name] = value;
          },
        };
      },
      querySelectorAll(selector) {
        assert.equal(selector, "[data-contact-form]");
        return forms;
      },
    },
    fetch: fetchImpl,
    window: {
      location: { href: "https://marlongreta.at/#contact" },
      turnstile: {
        resetCalled: false,
        reset() {
          this.resetCalled = true;
        },
      },
    },
  };

  vm.runInNewContext(contactScript, context, { filename: "contact.js" });
  return context;
}

test("German contact form sends the expected payload and shows success", async () => {
  const requests = [];
  const form = createForm({
    fields: {
      Name: "  Test User  ",
      "E-Mail": "  test@example.com ",
      Projektart: "Website fuer Unternehmen",
      Budgetrahmen: "1.000 bis 2.500 Euro",
      Zeitraum: "flexibel",
      Nachricht: "  Bitte meld dich.  ",
      Website: "",
      "cf-turnstile-response": "turnstile-token",
    },
  });

  const context = loadContactScript({
    forms: [form],
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });

  const event = await form.submit();

  assert.equal(event.prevented, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://collect.marlongreta1.workers.dev/contact");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.headers["Content-Type"], "application/json");

  const payload = JSON.parse(requests[0].options.body);
  assert.equal(payload.name, "Test User");
  assert.equal(payload.email, "test@example.com");
  assert.equal(payload.projectType, "Website fuer Unternehmen");
  assert.equal(payload.budget, "1.000 bis 2.500 Euro");
  assert.equal(payload.timeline, "flexibel");
  assert.equal(payload.message, "Bitte meld dich.");
  assert.equal(payload.website, "");
  assert.equal(payload.page, "https://marlongreta.at/#contact");
  assert.equal(payload.lang, "de");
  assert.equal(payload.turnstileToken, "turnstile-token");
  assert.match(payload.sentAt, /^\d{4}-\d{2}-\d{2}T/);

  assert.equal(form.resetCalled, true);
  assert.equal(form.status.textContent, "Danke, deine Anfrage wurde erfolgreich gesendet.");
  assert.equal(form.status.classList.contains("success"), true);
  assert.equal(form.button.disabled, false);
  assert.equal(form.button.textContent, "Anfrage senden");
  assert.equal(context.window.turnstile.resetCalled, true);
});

test("English contact form maps English field names", async () => {
  const requests = [];
  const form = createForm({
    lang: "en",
    buttonText: "Send inquiry",
    fields: {
      Name: "Jane Doe",
      Email: "jane@example.com",
      "Project type": "Landing page",
      Message: "Let's build this.",
    },
  });

  loadContactScript({
    forms: [form],
    lang: "en",
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });

  await form.submit();

  const payload = JSON.parse(requests[0].options.body);
  assert.equal(payload.email, "jane@example.com");
  assert.equal(payload.projectType, "Landing page");
  assert.equal(payload.message, "Let's build this.");
  assert.equal(payload.lang, "en");
  assert.equal(form.status.textContent, "Thanks, your inquiry was sent successfully.");
});

test("invalid form does not call the contact endpoint", async () => {
  let fetchCalled = false;
  const form = createForm({ valid: false });

  loadContactScript({
    forms: [form],
    fetchImpl: async () => {
      fetchCalled = true;
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });

  await form.submit();

  assert.equal(fetchCalled, false);
  assert.equal(form.resetCalled, false);
  assert.equal(form.status.textContent, "Bitte prüfe die markierten Felder.");
  assert.equal(form.status.classList.contains("error"), true);
});

test("failed endpoint response shows the fallback error", async () => {
  const form = createForm();

  loadContactScript({
    forms: [form],
    fetchImpl: async () => ({ ok: false }),
  });

  await form.submit();

  assert.equal(form.resetCalled, false);
  assert.equal(
    form.status.textContent,
    "Etwas ist schiefgelaufen. Bitte versuche es erneut oder kontaktiere das Studio direkt per E-Mail.",
  );
  assert.equal(form.status.classList.contains("error"), true);
  assert.equal(form.button.disabled, false);
});

test("missing endpoint shows an error and skips fetch", async () => {
  let fetchCalled = false;
  const form = createForm({ endpoint: "" });

  loadContactScript({
    forms: [form],
    fetchImpl: async () => {
      fetchCalled = true;
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });

  await form.submit();

  assert.equal(fetchCalled, false);
  assert.equal(
    form.status.textContent,
    "Etwas ist schiefgelaufen. Bitte versuche es erneut oder kontaktiere das Studio direkt per E-Mail.",
  );
  assert.equal(form.status.classList.contains("error"), true);
});


test("pending submission shows orb state, blocks duplicate sends and clears only after success", async () => {
  const form = createForm();
  let resolveRequest;
  let requests = 0;
  loadContactScript({ forms: [form], fetchImpl: () => {
    requests++;
    return new Promise(resolve => { resolveRequest = resolve; });
  } });
  const pending = form.submit();
  assert.equal(form.status.classList.contains("sending"), true);
  assert.equal(form.button.disabled, true);
  assert.equal(form.resetCalled, false);
  await form.submit();
  assert.equal(requests, 1);
  resolveRequest({ ok: true, json: async () => ({ ok: true }) });
  await pending;
  assert.equal(form.status.classList.contains("sending"), false);
  assert.equal(form.status.classList.contains("success"), true);
  assert.equal(form.resetCalled, true);
});

for (const [label, response] of [
  ["negative JSON confirmation", { ok: true, json: async () => ({ ok: false }) }],
  ["unexpected HTML response", { ok: true, json: async () => { throw new SyntaxError("not JSON"); } }],
]) {
  test(label + " preserves input and allows retry", async () => {
    const form = createForm({ fields: { Name: "Test", Nachricht: "Keep this message" } });
    loadContactScript({ forms: [form], fetchImpl: async () => response });
    await form.submit();
    assert.equal(form.resetCalled, false);
    assert.equal(form.fields.Nachricht, "Keep this message");
    assert.equal(form.status.classList.contains("error"), true);
    assert.equal(form.status.classList.contains("sending"), false);
    assert.equal(form.button.disabled, false);
  });
}
test("network failure allows a successful retry and updates nested status text", async () => {
  const form = createForm();
  const text = { textContent: "" };
  form.status.querySelector = () => text;
  let attempts = 0;
  loadContactScript({ forms: [form], fetchImpl: async () => {
    if (++attempts === 1) throw new Error("offline");
    return { ok: true, json: async () => ({ ok: true }) };
  } });
  await form.submit();
  assert.equal(form.resetCalled, false);
  assert.equal(form.status.classList.contains("error"), true);
  await form.submit();
  assert.equal(form.resetCalled, true);
  assert.equal(form.status.classList.contains("error"), false);
  assert.equal(form.status.classList.contains("success"), true);
  assert.match(text.textContent, /erfolgreich/);
  assert.equal(form.status.textContent, "");
});

test('partner inquiry includes support and collaboration without a stale direct-project budget', async () => {
  const form = createForm({fields:{Name:'Test', 'E-Mail':'test@example.com', Anliegen:'Entwicklungspartnerschaft', Unterstützung:'Backend', Zusammenarbeit:'Laufende Zusammenarbeit', Projektart:'Website', Budgetrahmen:'5.000 €', Nachricht:'Unterstützung für ein bestehendes Backend gesucht.'}});
  let payload;
  loadContactScript({forms:[form],fetchImpl:async (url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true})};}});
  await form.submit();
  assert.equal(payload.projectType,'Entwicklungspartnerschaft: Backend');
  assert.equal(payload.budget,'');
  assert.match(payload.message,/Art der Zusammenarbeit: Laufende Zusammenarbeit/);
  assert.equal(form.resetCalled,true);
});
test('direct inquiry preserves a free-form budget and omits stale partnership details', async () => {
  const form=createForm({fields:{Name:'Test','E-Mail':'test@example.com',Anliegen:'Eigenes Projekt',Projektart:'Webanwendung / Portal',Zusammenarbeit:'Laufend',Budgetrahmen:'5.000 bis 12.000 €',Nachricht:'Ein internes Portal entwickeln.'}});
  let payload;
  loadContactScript({forms:[form],fetchImpl:async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true})};}});
  await form.submit();
  assert.equal(payload.projectType,'Eigenes Projekt: Webanwendung / Portal');
  assert.equal(payload.budget,'5.000 bis 12.000 €');
  assert.equal(payload.message,'Ein internes Portal entwickeln.');
});
