import { requireAdmin } from "../../_lib/auth.js";
import { json, methodNotAllowed } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed("GET");
  const result = await requireAdmin(context.request, context.env);
  if (!result.ok) return result.response;
  return json({ ok: true, admin: true, uid: result.user.uid });
}
