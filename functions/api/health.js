import { json, methodNotAllowed } from "../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed("GET");
  const { env } = context;
  if (!env.DB) return json({ ok: false, database: "not_configured" }, 503);
  try {
    await env.DB.prepare("SELECT 1 AS ok").first();
    return json({ ok: true, database: "connected", stage: "phase-3" });
  } catch (_) {
    return json({ ok: false, database: "unavailable" }, 503);
  }
}
