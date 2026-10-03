import crypto from "crypto";

/**
 * Server-side HMAC-SHA256 signer for local/fallback session cookies.
 * Prevents privilege escalation via client-side cookie tampering (e.g., forging jf_mock_role=ADMIN).
 */
function getSigningSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SESSION_SECRET ||
    "jetfood-polman-internal-hmac-secret-key-2026"
  );
}

export interface SignedMockSessionPayload {
  role: "ADMIN" | "KURIR";
  code?: string;
  exp: number; // Unix timestamp in ms
}

/**
 * Create an HMAC-SHA256 signature token (`<exp>.<hmac>`) for a mock session cookie.
 */
export function signMockSession(
  role: "ADMIN" | "KURIR",
  code = "",
  ttlMs: number = 1000 * 60 * 60 * 12 // 12 hours default
): string {
  const exp = Date.now() + ttlMs;
  const data = `${role}:${code}:${exp}`;
  const hmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(data)
    .digest("hex");
  return `${exp}.${hmac}`;
}

/**
 * Verify an HMAC-SHA256 signature token (`<exp>.<hmac>`) against role and code.
 * Returns false if missing, malformed, expired, or tampered.
 */
export function verifyMockSessionSignature(
  role: string | undefined,
  code: string | undefined,
  signatureToken: string | undefined
): boolean {
  if (!role || (role !== "ADMIN" && role !== "KURIR")) {
    return false;
  }
  if (!signatureToken || typeof signatureToken !== "string") {
    return false;
  }

  const parts = signatureToken.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [expStr, providedHmac] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return false; // Expired or invalid timestamp
  }

  const normalizedCode = role === "KURIR" ? code || "JF-001" : "";
  const data = `${role}:${normalizedCode}:${exp}`;
  const expectedHmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(data)
    .digest("hex");

  const providedBuf = Buffer.from(providedHmac, "utf8");
  const expectedBuf = Buffer.from(expectedHmac, "utf8");

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}
