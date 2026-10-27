export function json(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "DENY",
    ...extraHeaders
  });
  return new Response(JSON.stringify(data), { status, headers });
}

export async function readJson(request, maxBytes = 8192) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > maxBytes) throw new Error("body_too_large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new Error("body_too_large");
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("invalid_json");
  }
}

export function methodNotAllowed(allowed) {
  return json({ error: "method_not_allowed" }, 405, { Allow: allowed });
}
