import { promises as fs } from "fs";
import path from "path";

const BASE = process.env.STORAGE_LOCAL_DIR || path.resolve(process.cwd(), "storage");

export async function saveReportImage(key: string, data: Buffer): Promise<string> {
  const p = path.join(BASE, "reports", key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data);
  return path.join(BASE, "reports", key);
}

export async function saveClaimEvidence(key: string, data: Buffer): Promise<string> {
  const p = path.join(BASE, "evidence", key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data);
  return path.join(BASE, "evidence", key);
}

export async function getReportImagePath(key: string): Promise<string> {
  const p = path.join(BASE, "reports", key);
  return p;
}

export async function getClaimEvidencePath(key: string): Promise<string> {
  const p = path.join(BASE, "evidence", key);
  return p;
}
