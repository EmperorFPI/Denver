import { handleLead } from "./lead.js";

/**
 * Worker entry point.
 *
 * Static assets (the Eleventy `_site` output, bound as ASSETS in wrangler.toml)
 * are served first by the runtime. Only requests that don't match a static file
 * reach this fetch handler, so we route the API here and delegate everything
 * else back to the asset server (which also handles 404.html).
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      return handleLead(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};
