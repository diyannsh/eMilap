import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
export async function pingDatabase(): Promise<boolean> {
  const client = await pool.connect();
  try { await client.query("SELECT 1"); return true; } finally { client.release(); }
}
export async function disconnectDatabase(): Promise<void> { await pool.end(); await prisma.$disconnect(); }
