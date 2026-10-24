/**
 * Production Environment Validation
 * Validates critical security keys, secrets, and database connectivity parameters.
 * Fails fast on boot if required secrets are missing or using dev defaults in production.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const isProduction = process.env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Database URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === "") {
    errors.push("DATABASE_URL is required but not set.");
  } else if (dbUrl.includes("placeholder") || dbUrl.includes("replace-with")) {
    errors.push("DATABASE_URL contains a placeholder connection string.");
  }

  // 2. Session Secret
  const sessionSecret = process.env.SESSION_SECRET;
  const defaultDevSecret = "dev-secret-change-me-min-32";
  if (!sessionSecret) {
    if (isProduction) {
      errors.push("SESSION_SECRET is required in production (minimum 32 characters).");
    } else {
      warnings.push("SESSION_SECRET not set, using insecure development fallback.");
    }
  } else if (isProduction && sessionSecret === defaultDevSecret) {
    errors.push("SESSION_SECRET must not use the default development secret in production.");
  } else if (isProduction && sessionSecret.length < 32) {
    errors.push(`SESSION_SECRET must be at least 32 characters long (current length: ${sessionSecret.length}).`);
  }

  // 3. Clue Encryption Key (AES-256-GCM)
  const encryptionKey = process.env.CLUE_ENCRYPTION_KEY || process.env.REPORT_ENCRYPTION_KEY;
  const defaultDevKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  if (!encryptionKey) {
    if (isProduction) {
      errors.push("CLUE_ENCRYPTION_KEY is required in production (64-character hex string representing 32 bytes).");
    } else {
      warnings.push("CLUE_ENCRYPTION_KEY not set, using development key.");
    }
  } else if (isProduction && encryptionKey === defaultDevKey) {
    errors.push("CLUE_ENCRYPTION_KEY must not use the known development hex key in production.");
  } else if (encryptionKey) {
    const isHex = /^[0-9a-fA-F]{64}$/.test(encryptionKey);
    if (!isHex) {
      errors.push("CLUE_ENCRYPTION_KEY must be a valid 64-character hex string (32 bytes for AES-256-GCM).");
    }
  }

  // 4. Storage Provider Configuration
  const isLocalStorage = process.env.STORAGE_LOCAL === "true";
  if (isProduction) {
    if (isLocalStorage) {
      warnings.push(
        "STORAGE_LOCAL=true is active in production. Uploaded media is saved to local container disk and will not persist across container recreations. Configure S3/R2/GCS for scalable production storage."
      );
    } else {
      const s3Bucket = process.env.S3_BUCKET_REPORTS || process.env.S3_BUCKET;
      const s3Key = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
      const s3Secret = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
      if (!s3Bucket || !s3Key || !s3Secret || s3Key.includes("replace-") || s3Secret.includes("replace-")) {
        warnings.push(
          "Production storage S3 credentials (S3_BUCKET_REPORTS, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) are incomplete or placeholder. Storage will fail closed until configured."
        );
      }
    }
  }

  // 5. Optional AI Service Provider Note
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("replace-"));
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("replace-"));
  if (!hasGemini && !hasOpenAI) {
    warnings.push(
      "Optional AI provider (GEMINI_API_KEY or OPENAI_API_KEY) is not configured. The chatbot and matching services run in deterministic fallback mode."
    );
  } else if (hasGemini && process.env.GEMINI_MODEL && (process.env.GEMINI_MODEL.includes("1.5") || process.env.GEMINI_MODEL.includes("2.0"))) {
    warnings.push(
      `GEMINI_MODEL='${process.env.GEMINI_MODEL}' references a deprecated/retired model family. Please configure an active free-tier model such as 'gemini-2.5-flash'.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
