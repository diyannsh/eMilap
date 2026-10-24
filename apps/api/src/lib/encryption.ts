import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
export const CURRENT_KEY_VERSION = "v1-aes-256-gcm";
const VERSION_BYTE = 0x01;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits for GCM

/**
 * Retrieve and validate the 32-byte encryption key from environment variables.
 * Fails closed if the key is missing or invalid.
 */
export function getEncryptionKey(): Buffer {
  const rawKey = process.env.CLUE_ENCRYPTION_KEY || process.env.REPORT_ENCRYPTION_KEY;
  if (!rawKey || typeof rawKey !== "string" || !rawKey.trim()) {
    throw new Error(
      "CLUE_ENCRYPTION_KEY is required for private ownership clue encryption. Failing closed without plaintext fallback."
    );
  }

  const trimmed = rawKey.trim();
  let keyBuffer: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    keyBuffer = Buffer.from(trimmed, "hex");
  } else if (/^[A-Za-z0-9+/]{43}=?=?$/.test(trimmed) && Buffer.from(trimmed, "base64").length === 32) {
    keyBuffer = Buffer.from(trimmed, "base64");
  } else if (Buffer.byteLength(trimmed, "utf-8") === 32) {
    keyBuffer = Buffer.from(trimmed, "utf-8");
  } else {
    throw new Error(
      `Invalid CLUE_ENCRYPTION_KEY length: expected 32 bytes (256-bit key or 64 hex characters). Failing closed.`
    );
  }

  return keyBuffer;
}

/**
 * Encrypts private ownership clues using AES-256-GCM.
 * Returns a versioned binary envelope: [1 byte version][12 bytes IV][16 bytes AuthTag][N bytes Ciphertext]
 */
export function encryptClue(plaintext: string): { ciphertext: Buffer; version: string } {
  if (typeof plaintext !== "string" || !plaintext.trim()) {
    throw new Error("Plaintext clue must be a non-empty string");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext.trim(), "utf-8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const envelope = Buffer.concat([
    Buffer.from([VERSION_BYTE]),
    iv,
    authTag,
    encrypted,
  ]);

  return {
    ciphertext: envelope,
    version: CURRENT_KEY_VERSION,
  };
}

/**
 * Decrypts a versioned AES-256-GCM envelope.
 * Strictly verifies integrity via the auth tag and fails closed if corrupted or tampered.
 */
export function decryptClue(envelope: Buffer | Uint8Array, version?: string): string {
  const buf = Buffer.isBuffer(envelope) ? envelope : Buffer.from(envelope);

  if (buf.length < 1 + IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error("Invalid ciphertext envelope: buffer too short");
  }

  const versionByte = buf[0];
  if (versionByte !== VERSION_BYTE || (version && version !== CURRENT_KEY_VERSION)) {
    throw new Error(
      `Unsupported encryption envelope version: byte=${versionByte}, expected=${VERSION_BYTE}, version=${version}`
    );
  }

  const key = getEncryptionKey();
  const iv = buf.subarray(1, 1 + IV_LENGTH);
  const authTag = buf.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(1 + IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}
