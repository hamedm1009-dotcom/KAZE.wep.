import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export async function requireUser(request, env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId || projectId.startsWith("REPLACE_")) {
    return { ok: false, response: new Response(JSON.stringify({ error: "auth_not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    }) };
  }

  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, response: new Response(JSON.stringify({ error: "authentication_required" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "WWW-Authenticate": "Bearer" }
    }) };
  }

  try {
    const { payload } = await jwtVerify(match[1], FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"]
    });
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.sub !== "string" || payload.sub.length === 0 ||
        !Number.isFinite(payload.exp) || !Number.isFinite(payload.iat) ||
        !Number.isFinite(payload.auth_time) || payload.iat > now + 60 || payload.auth_time > now + 60 || payload.auth_time > payload.iat) {
      throw new Error("invalid_claims");
    }
    return {
      ok: true,
      user: {
        uid: payload.sub,
        email: typeof payload.email === "string" ? payload.email : null,
        emailVerified: payload.email_verified === true,
        displayName: typeof payload.name === "string" ? payload.name : null
      }
    };
  } catch (_) {
    return { ok: false, response: new Response(JSON.stringify({ error: "invalid_or_expired_token" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "WWW-Authenticate": "Bearer", "X-Content-Type-Options": "nosniff" }
    }) };
  }
}

export async function requireAdmin(request, env) {
  const authenticated = await requireUser(request, env);
  if (!authenticated.ok) return authenticated;
  const adminUid = env.ADMIN_UID;
  if (!adminUid) {
    return { ok: false, response: new Response(JSON.stringify({ error: "admin_not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    }) };
  }
  if (authenticated.user.uid !== adminUid) {
    return { ok: false, response: new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    }) };
  }
  return authenticated;
}
