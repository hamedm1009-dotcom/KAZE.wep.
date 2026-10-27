import { requireUser } from "../_lib/auth.js";
import { json, methodNotAllowed, readJson } from "../_lib/http.js";

function normalizedName(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET" && request.method !== "POST") return methodNotAllowed("GET, POST");
  const result = await requireUser(request, env);
  if (!result.ok) return result.response;
  if (!env.DB) return json({ error: "database_not_configured" }, 503);

  if (request.method === "GET") {
    try {
      const row = await env.DB.prepare(
        "SELECT display_name AS displayName, email, phone, created_at AS createdAt, updated_at AS updatedAt FROM customer_profiles WHERE auth_uid = ?"
      ).bind(result.user.uid).first();
      return json({ user: { uid: result.user.uid, email: result.user.email, emailVerified: result.user.emailVerified }, profile: row || null });
    } catch (_) {
      return json({ error: "profile_unavailable" }, 503);
    }
  }

  let body;
  try {
    body = await readJson(request, 8192);
  } catch (error) {
    return json({ error: error.message === "body_too_large" ? "body_too_large" : "invalid_json" }, 400);
  }

  const suppliedName = normalizedName(body.displayName);
  const displayName = suppliedName || normalizedName(result.user.displayName) || (result.user.email ? result.user.email.split("@")[0].slice(0, 80) : "KAZE customer");
  if (displayName.length < 2) return json({ error: "invalid_display_name" }, 400);
  const email = result.user.email || "";
  if (!email || email.length > 254) return json({ error: "valid_email_required" }, 400);

  try {
    await env.DB.prepare(`
      INSERT INTO customer_profiles (auth_uid, email, display_name)
      VALUES (?, ?, ?)
      ON CONFLICT(auth_uid) DO UPDATE SET
        email = excluded.email,
        display_name = excluded.display_name,
        updated_at = CURRENT_TIMESTAMP
    `).bind(result.user.uid, email, displayName).run();

    const row = await env.DB.prepare(
      "SELECT display_name AS displayName, email, phone, created_at AS createdAt, updated_at AS updatedAt FROM customer_profiles WHERE auth_uid = ?"
    ).bind(result.user.uid).first();
    return json({ ok: true, profile: row }, 200);
  } catch (_) {
    return json({ error: "profile_save_failed" }, 503);
  }
}
