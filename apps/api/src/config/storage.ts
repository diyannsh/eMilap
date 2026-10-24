import { S3Client } from "@aws-sdk/client-s3";

export function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  return new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle,
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

export const s3Client = getS3Client();

export const storageConfig = {
  get reportsBucket() {
    return process.env.S3_BUCKET_REPORTS || "foundnear-reports";
  },
  get evidenceBucket() {
    return process.env.S3_BUCKET_EVIDENCE || "foundnear-evidence";
  },
};
