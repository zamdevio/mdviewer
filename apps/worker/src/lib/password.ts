const PBKDF2_ITERATIONS = 100_000;
const HASH_PREFIX = "pbkdf2-sha256";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations,
    },
    baseKey,
    256,
  );
  return new Uint8Array(bits);
}

/** Storeable password hash (never plaintext). */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  return `${HASH_PREFIX}:${PBKDF2_ITERATIONS}:${bytesToBase64(salt)}:${bytesToBase64(key)}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== HASH_PREFIX) return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = base64ToBytes(parts[2]);
  const expected = base64ToBytes(parts[3]);
  const actual = await deriveKey(password, salt, iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export function readSharePassword(request: Request): string | null {
  const header = request.headers.get("X-Share-Password");
  if (header == null || header === "") return null;
  return header;
}

/** Prefer Authorization Bearer; fall back to X-Share-Manage-Token. */
export function readManageToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (match?.[1]) return match[1];
  }
  const header = request.headers.get("X-Share-Manage-Token");
  if (header == null || header === "") return null;
  return header;
}

export type ManageAuthFail = {
  status: 401 | 403;
  error: string;
  message: string;
};

/** Verify manage token against stored hash. View password must not call this. */
export async function requireManageToken(
  manageTokenHash: string | null | undefined,
  request: Request,
): Promise<ManageAuthFail | null> {
  if (!manageTokenHash) {
    return {
      status: 403,
      error: "Manage token required",
      message:
        "This share has no manage token. Create a new share with a manage token.",
    };
  }
  const token = readManageToken(request);
  if (!token) {
    return {
      status: 401,
      error: "Unauthorized",
      message:
        "Provide Authorization: Bearer <manageToken> or X-Share-Manage-Token.",
    };
  }
  const ok = await verifyPassword(token, manageTokenHash);
  if (!ok) {
    return {
      status: 401,
      error: "Unauthorized",
      message: "Invalid manage token.",
    };
  }
  return null;
}
