import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL || "";
const isSslRequired =
  !databaseUrl.includes("sslmode=disable") &&
  (databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("supabase") ||
    (process.env.NODE_ENV === "production" &&
      !databaseUrl.includes("localhost") &&
      !databaseUrl.includes("127.0.0.1")));

export const pool = new Pool({
  connectionString: databaseUrl,
  ...(isSslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const prisma = new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
export async function pingDatabase(): Promise<boolean> {
  const client = await pool.connect();
  try { await client.query("SELECT 1"); return true; } finally { client.release(); }
}
export async function disconnectDatabase(): Promise<void> { await pool.end(); await prisma.$disconnect(); }
