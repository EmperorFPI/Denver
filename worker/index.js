import { createFetchHandler } from "notary-lead-form/worker";

/**
 * Worker entry point.
 *
 * Static assets (the Eleventy `_site` output, bound as ASSETS in wrangler.toml)
 * are served first by the runtime. Only requests that don't match a static file
 * reach the fetch handler, which routes POST /api/lead and delegates everything
 * else back to the asset server (which also handles 404.html).
 *
 * The GHL webhook URL comes from the GHL_WEBHOOK_URL secret
 * (`wrangler secret put GHL_WEBHOOK_URL`) and never ships to the browser.
 */
export default createFetchHandler({
  brand: "Denver Mobile Notary Service",
  sourceSite: "denvermobilenotaryservice.com",
});
