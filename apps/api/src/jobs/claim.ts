import { prisma } from "../db/client";

export async function claimNextJob(): Promise<{ id: string } | null> {
  // Placeholder: SELECT ... FOR UPDATE SKIP LOCKED; update locked_at/locked_by
  return null;
}
