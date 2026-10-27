import { json, methodNotAllowed } from "../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed("GET");
  const { env } = context;
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  try {
    const result = await env.DB.prepare(
      "SELECT slug, name_ar AS nameAr, name_en AS nameEn, sort_order AS sortOrder FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, slug ASC"
    ).all();
    return json({ categories: result.results || [] });
  } catch (_) {
    return json({ error: "categories_unavailable" }, 503);
  }
}
