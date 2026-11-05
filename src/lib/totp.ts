import crypto from "crypto";

/**
 * Base32 decode RFC 4648
 */
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generate 6-digit RFC 6238 TOTP code
 */
export function generateTotp(secretBase32: string, timeStepSeconds: number = 30): {
  code: string;
  remainingSeconds: number;
  period: number;
  currentWindow: number;
} {
  const period = timeStepSeconds;
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  const remainingSeconds = period - (now % period);

  const secretBuffer = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, "0");

  return {
    code: otp,
    remainingSeconds,
    period,
    currentWindow: counter,
  };
}

/**
 * Verify TOTP code with 1 window skew tolerance (previous, current, next)
 */
export function verifyTotp(
  secretBase32: string,
  userCode: string,
  timeStepSeconds: number = 30
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(now / timeStepSeconds);

  const secretBuffer = base32Decode(secretBase32);

  // Check current window and +/- 1 window for slight clock skew
  for (const counter of [currentCounter, currentCounter - 1, currentCounter + 1]) {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, "0");
    if (otp === userCode.trim()) {
      return true;
    }
  }
  return false;
}

/**
 * Generates an encrypted payload for the Dynamic QR Code displayed on the operator's digital passport.
 */
export function createDynamicQrPayload(userId: string, registrationNumber: string, secretBase32: string): {
  payloadString: string;
  code: string;
  remainingSeconds: number;
} {
  const { code, remainingSeconds, currentWindow } = generateTotp(secretBase32);
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", process.env.SMART_POP_SYSTEM_SECRET || "default_secret")
    .update(`${userId}:${registrationNumber}:${code}:${currentWindow}`)
    .digest("hex")
    .substring(0, 16);

  const payloadString = JSON.stringify({
    app: "SmartPOP_Passport",
    uid: userId,
    reg: registrationNumber,
    totp: code,
    win: currentWindow,
    sig: signature,
    ts: timestamp,
  });

  return {
    payloadString,
    code,
    remainingSeconds,
  };
}
