/**
 * Signed admin session tokens.
 *
 * Runs on both the edge (middleware) and Node (server actions), so it uses
 * Web Crypto only. The token is `payload.signature`, both base64url, signed
 * with HMAC-SHA256 under ADMIN_SESSION_SECRET. The signature proves we issued
 * it; whether the account is still allowed in is checked against the
 * database on every admin render (see lib/auth/admin.ts).
 */

export const SESSION_COOKIE = "dw_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  /** admin_accounts.id */
  sub: string;
  /** admin_accounts.session_version — bumping it signs everyone out of that account. */
  v: number;
  /** Expiry, unix seconds. */
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(payload: SessionPayload, secret: string) {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(sig),
      encoder.encode(body),
    );
    if (!ok) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.sub !== "string" || typeof payload.v !== "number") return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
