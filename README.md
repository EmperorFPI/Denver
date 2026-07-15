# denvermobilenotaryservice.com

Lead-gen static site for the Denver city brand. Eleventy 3.x → GitHub → Cloudflare Pages, with lead capture proxied through a Pages Function into the Denver GHL sub-account.

## Stack

- **SSG:** Eleventy 3.x (ESM config), Nunjucks templates, markdown content
- **Hosting:** Cloudflare Pages (auto-deploy on push to `main`)
- **Lead pipeline:** form → `POST /api/lead` (Pages Function) → GHL inbound webhook (JSON)
- **Attribution:** client JS persists UTM params + `gclid` in sessionStorage across the session; hidden fields carry them into the lead payload

## Local development

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # outputs to _site/
```

## Deploy (first time)

1. Create the private GitHub repo and push:
   ```bash
   git init && git add -A && git commit -m "Initial site"
   git branch -M main
   git remote add origin git@github.com:EmperorFPI/denvermobilenotaryservice.git
   git push -u origin main
   ```
2. Cloudflare Pages → **Create project → Connect to Git** → select the repo.
   - Build command: `npx @11ty/eleventy`
   - Build output directory: `_site`
3. **Settings → Environment variables** (Production *and* Preview):
   - `GHL_WEBHOOK_URL` = the Denver sub-account inbound webhook URL (see below)
4. **Custom domains** → add `denvermobilenotaryservice.com` and `www` (Cloudflare handles the cert). Set `www` → apex redirect in Bulk Redirects or a `_redirects` rule if desired.

## GHL wiring (Denver sub-account)

1. Create the Denver sub-account workflow with an **Inbound Webhook** trigger.
2. **Prime the webhook before saving it** — GHL inbound webhooks must receive a test POST containing *every field you'll ever want to map*. Run this curl with the real webhook URL:

   ```bash
   curl -X POST 'https://services.leadconnectorhq.com/hooks/XXXX/webhook-trigger/YYYY' \
     -H 'Content-Type: application/json' \
     -d '{
       "first_name": "Test",
       "last_name": "Lead",
       "phone": "+13035550100",
       "email": "test@example.com",
       "service_type": "Mobile notary — general documents",
       "zip": "80211",
       "documents": "Priming payload — includes every field the site sends",
       "utm_source": "google",
       "utm_medium": "cpc",
       "utm_campaign": "denver-mobile-notary",
       "utm_term": "mobile notary denver",
       "utm_content": "ad-variant-a",
       "gclid": "TEST_GCLID",
       "landing_page": "/service-areas/aurora/?utm_source=google",
       "referrer": "https://www.google.com/",
       "source_site": "denvermobilenotaryservice.com",
       "brand": "Denver Mobile Notary Service",
       "submitted_at": "2026-07-08T12:00:00.000Z",
       "ip_country": "US"
     }'
   ```
3. Map fields in the workflow (contact create/update, tag `denver-web-lead`, tag by `service_type`), then mirror the NotaryPro→CloseClear branch logic: RON vs. in-person routing, POST to CloseClear `receive_lead.asp`, store the 200 response on the contact.
4. Set `GHL_WEBHOOK_URL` in Cloudflare Pages env vars and redeploy. Submit the live form once end-to-end and confirm the contact lands with all attribution fields.

## Conversion tracking

- `src/_data/site.json` holds `{{GTAG_ID}}` and `{{GTAG_CONVERSION_LABEL}}` placeholders.
- gtag snippets are present but **commented out** in `src/_includes/layouts/base.njk` (config) and `src/thank-you.njk` (conversion event). Replace placeholders, uncomment, push.
- `/thank-you/` is `noindex` (meta + `X-Robots-Tag` in `_headers`) and excluded from the sitemap — it exists purely as the conversion surface.

## Before launch checklist

- [ ] **Replace the placeholder phone number** — `(720) 555-0134` / `+17205550134` in `src/_data/site.json` (single source; header, footer, CTAs, and schema all pull from it)
- [ ] Replace placeholder email in `site.json`
- [ ] Register **Denver Mobile Notary Service** DBA in Colorado (Stripe statement descriptor compliance, same as Austin)
- [ ] Connect the Denver Stripe account to the Denver GHL sub-account (isolated ledger for the brand experiment)
- [ ] Prime + wire the GHL inbound webhook (above), set `GHL_WEBHOOK_URL`
- [ ] Run homepage, one service page, and one area page through the Rich Results Test before assuming the schema pattern holds
- [ ] Verify `/sitemap.xml` renders and submit in Search Console; verify domain property
- [ ] Create the Denver Google Business Profile
- [ ] Wire gtag + conversion label when the Denver campaign spins up

## Content conventions

Follows the NotaryPro content skill: direct, mechanics-grounded voice; honest fee ranges anchored to Colorado's $15/$25 caps; "what it can't do" sections on every service; no pre-signing note in consumer instructions; area pages differentiated by genuine local demand patterns (Anschutz bedside work in Aurora, Federal Center in Lakewood, estate corridor in Littleton, etc.) — not token-swapped templates, per the scaled-content policy risk.

Adding an area page: drop a `.md` in `src/areas/` using `layouts/area.njk` frontmatter (see `aurora.md`); it auto-joins the footer, homepage chips, hub page, nearby-areas cross-links, and sitemap.

Adding a service: drop a `.md` in `src/services/` with an `order` value; same auto-wiring.

## Structure

```
├── eleventy.config.js         Eleventy 3.x ESM config
├── functions/api/lead.js      Pages Function → GHL webhook proxy (honeypot, validation, enrichment)
├── src/
│   ├── _data/site.json        NAP, fees, service areas, gtag placeholders — edit here first
│   ├── _includes/
│   │   ├── layouts/           base / service / area
│   │   └── partials/lead-form.njk
│   ├── css/styles.css         design tokens: ink navy + seal gold, Zilla Slab + Public Sans
│   ├── js/lead.js             UTM capture + fetch submit + thank-you redirect
│   ├── index.njk              homepage (hero + form, FAQPage schema)
│   ├── services/  (5)         mobile-notary, RON, apostille, loan-signing, hospital-jail
│   ├── areas/     (6)         aurora, lakewood, littleton, arvada, westminster, centennial
│   ├── pricing.md, faq.md, services.njk, service-areas.njk, thank-you.njk, 404.md
│   ├── sitemap.njk, robots.txt, _headers
```
