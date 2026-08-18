export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

interface AuthEnv {
  ADMIN_PASSWORD: string;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Constant-time string comparison, used only for the raw password check. */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const length = Math.max(aBytes.length, bBytes.length, 1);
  let mismatch = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < length; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return mismatch === 0;
}

async function deriveSigningKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function verifyPassword(env: AuthEnv, candidate: string): boolean {
  return timingSafeEqual(candidate, env.ADMIN_PASSWORD);
}

/**
 * Issues a signed, stateless session token: a base64url payload (just an
 * expiry timestamp) plus an HMAC-SHA256 signature, both keyed off a hash of
 * ADMIN_PASSWORD. No session storage is needed — the Worker can verify any
 * token it previously issued without persisting anything.
 */
export async function createSessionToken(env: AuthEnv): Promise<{ token: string; maxAge: number }> {
  const key = await deriveSigningKey(env.ADMIN_PASSWORD);
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return { token: `${payloadB64}.${toBase64Url(signature)}`, maxAge: SESSION_TTL_SECONDS };
}

export async function verifySessionToken(env: AuthEnv, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  const key = await deriveSigningKey(env.ADMIN_PASSWORD);
  const validSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sigB64),
    new TextEncoder().encode(payloadB64),
  );
  if (!validSignature) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as { exp: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
