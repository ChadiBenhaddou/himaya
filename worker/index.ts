/**
 * Cloudflare Worker entry (used by `wrangler deploy`, see wrangler.jsonc).
 * Static files in ./out are served by Cloudflare directly; only /api/* reaches this code.
 * Secrets come from the Worker's Settings → Variables and Secrets (or .dev.vars locally).
 */
import { handleLeadRequest } from "../server/lead-handler";
import type { WebhookEnv } from "../server/sheets-webhook";

interface Env extends WebhookEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/leads") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return handleLeadRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
