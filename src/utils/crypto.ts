const encoder = new TextEncoder();

function hexEncode(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexDecode(hex: string): Uint8Array {
  const bytes = hex.match(/.{2}/g);
  if (!bytes) return new Uint8Array(0);
  return new Uint8Array(bytes.map((h) => parseInt(h, 16)));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hashBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return `${hexEncode(salt.buffer)}:${hexEncode(hashBits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = hexDecode(saltHex);
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hashBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return hexEncode(hashBits) === hashHex;
}

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlStr(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlDecodeStr(b64: string): string {
  return atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function signRefreshToken(sub: string, secret: string, expiresInSeconds: number): Promise<string> {
  const header = b64urlStr(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64urlStr(JSON.stringify({ sub, iat: now, exp: now + expiresInSeconds }));
  const msg = `${header}.${body}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(msg));
  return `${msg}.${b64url(sig)}`;
}

export async function verifyRefreshToken(token: string, secret: string): Promise<{ sub: string }> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [header, body, sig] = parts;
  const msg = `${header}.${body}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "verify",
  ]);
  const sigBytes = Uint8Array.from(b64urlDecodeStr(sig), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(msg));
  if (!valid) throw new Error("Invalid signature");
  const claims = JSON.parse(b64urlDecodeStr(body)) as { sub: string; exp: number };
  if (claims.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return { sub: claims.sub };
}
