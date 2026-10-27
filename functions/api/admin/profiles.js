import { requireAdmin } from "../../_lib/auth.js";
import { json, methodNotAllowed } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed("GET");
  const result = await requireAdmin(context.request, context.env);
  if (!result.ok) return result.response;
  if (!context.env.DB) return json({ error: "database_not_configured" }, 503);
  try {
    const rows = await context.env.DB.prepare(
      "SELECT auth_uid AS uid, display_name AS displayName, email, created_at AS createdAt FROM customer_profiles ORDER BY created_at DESC LIMIT 25"
    ).all();
    return json({ profiles: rows.results || [] });
  } catch (_) {
    return json({ error: "profiles_unavailable" }, 503);
  }
}
