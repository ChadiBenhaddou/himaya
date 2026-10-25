/**
 * Cloudflare Pages Function → POST /api/leads
 * Secrets come from Pages → Settings → Variables and Secrets (or .dev.vars locally).
 */
import { handleLeadRequest } from "../../server/lead-handler";
import type { WebhookEnv } from "../../server/sheets-webhook";

interface PagesContext {
  request: Request;
  env: WebhookEnv;
}

export const onRequestPost = ({ request, env }: PagesContext) => handleLeadRequest(request, env);
