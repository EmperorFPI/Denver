/**
 * POST /api/lead
 * Receives the lead form, filters spam, and forwards to the GoHighLevel
 * inbound webhook defined in the GHL_WEBHOOK_URL environment variable
 * (set in Cloudflare Pages → Settings → Environment variables).
 *
 * Keeping the webhook URL server-side means it never ships to the browser,
 * and we can enrich the payload (IP country, timestamp, source site) before
 * it hits the GHL workflow.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "invalid_form" }, 400);
  }

  // Honeypot: humans never see this field. If it's filled, pretend success.
  if ((form.get("company_website") || "").trim() !== "") {
    return json({ ok: true });
  }

  // Minimal validation — the client validates too, but never trust the client.
  const required = ["first_name", "last_name", "phone", "email", "service_type", "city"];
  for (const f of required) {
    if (!(form.get(f) || "").trim()) {
      return json({ ok: false, error: "missing_" + f }, 422);
    }
  }

  if (!env.GHL_WEBHOOK_URL) {
    // Misconfiguration should be loud in logs but soft for the user.
    console.error("GHL_WEBHOOK_URL is not set");
    return json({ ok: false, error: "not_configured" }, 500);
  }

  const firstName = (form.get("first_name") || "").trim();
  const lastName = (form.get("last_name") || "").trim();

  const payload = {
    first_name: firstName,
    last_name: lastName,
    phone: form.get("phone"),
    email: form.get("email"),
    service_type: form.get("service_type"),
    city: form.get("city"),
    timeframe: form.get("timeframe") || "",
    documents: form.get("documents") || "",
    special_instructions: form.get("special_instructions") || "",
    utm_source: form.get("utm_source") || "",
    utm_medium: form.get("utm_medium") || "",
    utm_campaign: form.get("utm_campaign") || "",
    utm_term: form.get("utm_term") || "",
    utm_content: form.get("utm_content") || "",
    gclid: form.get("gclid") || "",
    landing_page: form.get("landing_page") || "",
    referrer: form.get("referrer") || "",
    source_site: "denvermobilenotaryservice.com",
    brand: "Denver Mobile Notary Service",
    submitted_at: new Date().toISOString(),
    ip_country: request.headers.get("cf-ipcountry") || "",
  };

  const ghlRes = await fetch(env.GHL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!ghlRes.ok) {
    console.error("GHL webhook rejected lead:", ghlRes.status, await ghlRes.text());
    return json({ ok: false, error: "upstream_failed" }, 502);
  }

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
