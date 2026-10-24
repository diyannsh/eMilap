import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptClue, decryptClue, getEncryptionKey, CURRENT_KEY_VERSION } from "./encryption";
import crypto from "crypto";

describe("AES-256-GCM Private Clue Encryption", () => {
  const originalEnv = process.env.CLUE_ENCRYPTION_KEY;
  const testKeyHex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 32 bytes

  beforeEach(() => {
    process.env.CLUE_ENCRYPTION_KEY = testKeyHex;
  });

  afterEach(() => {
    process.env.CLUE_ENCRYPTION_KEY = originalEnv;
  });

  it("encrypts and decrypts private clues correctly", () => {
    const originalClue = "Distinctive engraving 'NK 2026' on the underside rim.";
    const encrypted = encryptClue(originalClue);

    expect(encrypted.version).toBe(CURRENT_KEY_VERSION);
    expect(Buffer.isBuffer(encrypted.ciphertext)).toBe(true);
    // Ensure ciphertext does not contain raw plaintext
    expect(encrypted.ciphertext.toString("utf-8")).not.toContain("NK 2026");

    const decrypted = decryptClue(encrypted.ciphertext, encrypted.version);
    expect(decrypted).toBe(originalClue);
  });

  it("produces non-deterministic ciphertext for identical plaintexts (unique IV per encryption)", () => {
    const clue = "Secret scratch pattern";
    const enc1 = encryptClue(clue);
    const enc2 = encryptClue(clue);

    expect(enc1.ciphertext.equals(enc2.ciphertext)).toBe(false);
    expect(decryptClue(enc1.ciphertext)).toBe(clue);
    expect(decryptClue(enc2.ciphertext)).toBe(clue);
  });

  it("fails closed if the ciphertext is tampered with", () => {
    const originalClue = "Serial number: AB-987654";
    const encrypted = encryptClue(originalClue);

    // Tamper with the ciphertext byte
    const tampered = Buffer.from(encrypted.ciphertext);
    const lastIdx = tampered.length - 1;
    tampered[lastIdx] = ((tampered[lastIdx] ?? 0) ^ 0xff);

    expect(() => decryptClue(tampered, encrypted.version)).toThrow();
  });

  it("fails closed if the auth tag is tampered with", () => {
    const originalClue = "Engraved initials";
    const encrypted = encryptClue(originalClue);

    // Tamper with auth tag byte (bytes 13 to 28)
    const tampered = Buffer.from(encrypted.ciphertext);
    tampered[15] = ((tampered[15] ?? 0) ^ 0xaa);

    expect(() => decryptClue(tampered, encrypted.version)).toThrow();
  });

  it("fails closed when CLUE_ENCRYPTION_KEY is missing", () => {
    delete process.env.CLUE_ENCRYPTION_KEY;
    delete process.env.REPORT_ENCRYPTION_KEY;

    expect(() => getEncryptionKey()).toThrow(/required/i);
    expect(() => encryptClue("Test clue")).toThrow(/required/i);
  });

  it("fails closed when CLUE_ENCRYPTION_KEY has invalid length", () => {
    process.env.CLUE_ENCRYPTION_KEY = "too-short-key";

    expect(() => getEncryptionKey()).toThrow(/Invalid CLUE_ENCRYPTION_KEY length/i);
  });
});
