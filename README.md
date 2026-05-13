# 📊 Personal Portfolio with Custom Tracking System

This project is my personal **portfolio website** combined with a fully self-hosted **visitor tracking system** — built using **Cloudflare Workers**, **Supabase (PostgreSQL)**, and **Grafana** for visualization.

Everything runs without Google Analytics or external tracking providers — privacy-friendly, lightweight, and fully under my control.

---

## 🚀 Overview

- **Website:** Static portfolio (HTML, CSS, JS)
- **Tracking:** Custom JavaScript tracker (`track.js`)
- **Serverless API:** Cloudflare Worker (`worker.js`) receives and stores data
- **Database:** Supabase (PostgreSQL)
- **Analytics Dashboard:** Grafana (self-hosted)

---

## 🧩 System Architecture

```text
[Visitor Browser]
     ↓
  track.js (sends event data)
     ↓
  Cloudflare Worker (serverless endpoint)
     ↓
  Supabase (PostgreSQL database)
     ↓
  Grafana Dashboard (data visualization)
```

## Contact Form Backend

The portfolio contact form posts JSON to the existing Cloudflare Worker at `/contact`.
Configure these Worker environment variables before deploying:

- `RESEND_API_KEY`: API key for sending email through Resend.
- `CONTACT_TO_EMAIL`: destination inbox, for example `marlongreta1@gmail.com`.
- `CONTACT_FROM_EMAIL`: verified sender, for example `Portfolio <contact@marlongreta.at>`.
- `TURNSTILE_SECRET_KEY`: optional but recommended Cloudflare Turnstile secret for spam protection.

If `TURNSTILE_SECRET_KEY` is set, add the matching public site key to the form as
`data-turnstile-sitekey="your-public-site-key"`. The frontend will render the
Turnstile widget automatically. Keep all secret values in Cloudflare Worker settings,
never in the frontend.
