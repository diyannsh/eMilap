import { pathToFileURL } from "node:url";
import { prisma } from "../db/client.js";

export const ALGORITHM_VERSION = "deterministic-v1.0";
const MAX_ATTEMPTS = 3;

export interface ScoreBreakdown {
  category: number;
  color: number;
  location: number;
  time?: number;
}

export function computeDeterministicScore(
  reportA: { category: string; color?: string | null; approximateLocation?: string | null; occurredAt?: Date | null },
  reportB: { category: string; color?: string | null; approximateLocation?: string | null; occurredAt?: Date | null }
): { score: number; breakdown: ScoreBreakdown } {
  let score = 0;
  const breakdown: ScoreBreakdown = { category: 0, color: 0, location: 0 };

  // Category match (+30)
  if (reportA.category && reportB.category && reportA.category.toUpperCase() === reportB.category.toUpperCase()) {
    score += 30;
    breakdown.category = 30;
  }

  // Color match (+25)
  if (reportA.color && reportB.color) {
    const colA = reportA.color.toLowerCase().trim();
    const colB = reportB.color.toLowerCase().trim();
    if (colA === colB || colA.includes(colB) || colB.includes(colA)) {
      score += 25;
      breakdown.color = 25;
    }
  }

  // Approximate location match (+20)
  if (reportA.approximateLocation && reportB.approximateLocation) {
    const locA = reportA.approximateLocation.toLowerCase().trim();
    const locB = reportB.approximateLocation.toLowerCase().trim();
    if (locA === locB || locA.includes(locB) || locB.includes(locA)) {
      score += 20;
      breakdown.location = 20;
    }
  }

  // Time proximity match (+15 if within 48 hours)
  if (reportA.occurredAt && reportB.occurredAt) {
    const diffHours = Math.abs(new Date(reportA.occurredAt).getTime() - new Date(reportB.occurredAt).getTime()) / (1000 * 60 * 60);
    if (diffHours <= 48) {
      score += 15;
      breakdown.time = 15;
    }
  }

  return { score: Math.min(100, score), breakdown };
}

export async function processMatchingJobs(workerId: string = `worker-${process.pid}`): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    // 1. Safe query: Find pending or retry jobs ready for processing
    const readyJobs = await prisma.matchingJob.findMany({
      where: {
        status: { in: ["PENDING", "RETRY"] },
        availableAt: { lte: new Date() },
        lockedAt: null,
      },
      take: 5,
      orderBy: { availableAt: "asc" },
    });

    for (const job of readyJobs) {
      // 2. Safe idempotent lock
      const claimed = await prisma.matchingJob.updateMany({
        where: {
          id: job.id,
          status: { in: ["PENDING", "RETRY"] },
          lockedAt: null,
        },
        data: {
          status: "PROCESSING",
          lockedAt: new Date(),
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });

      if (claimed.count === 0) continue;

      try {
        await executeMatchingForJob(job);
        await prisma.matchingJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            lockedAt: null,
            lockedBy: null,
          },
        });
        processed++;
      } catch (err: any) {
        errors++;
        const nextAttempts = job.attempts + 1;
        const isFailed = nextAttempts >= MAX_ATTEMPTS;
        // Bounded exponential backoff: 10s, 30s, 60s
        const backoffSeconds = Math.min(60, Math.pow(2, nextAttempts) * 5);
        const nextAvailableAt = new Date(Date.now() + backoffSeconds * 1000);

        await prisma.matchingJob.update({
          where: { id: job.id },
          data: {
            status: isFailed ? "FAILED" : "RETRY",
            availableAt: nextAvailableAt,
            lockedAt: null,
            lockedBy: null,
            lastErrorCode: err.message || "Unknown matching execution error",
          },
        });
      }
    }
  } catch (err) {
    console.error(`[Worker ${workerId}] Batch matching query error:`, err);
    errors++;
  }

  return { processed, errors };
}

async function executeMatchingForJob(job: { id: string; communityId: string; reportId: string; reportVersion: number }) {
  const targetReport = await prisma.itemReport.findUnique({
    where: { id: job.reportId },
  });

  if (!targetReport || targetReport.status !== "OPEN") {
    return;
  }

  const oppositeType = targetReport.reportType === "LOST" ? "FOUND" : "LOST";

  // Find open opposite-type reports within the same community
  const candidates = await prisma.itemReport.findMany({
    where: {
      communityId: targetReport.communityId,
      reportType: oppositeType,
      status: "OPEN",
      id: { not: targetReport.id },
    },
    take: 50,
  });

  for (const candidate of candidates) {
    const { score, breakdown } = computeDeterministicScore(targetReport, candidate);

    // Threshold for candidate pairing
    if (score >= 40) {
      // Consistent canonical pairing: reportAId must be lower UUID string than reportBId
      const [firstReport, secondReport] =
        targetReport.id < candidate.id
          ? [targetReport, candidate]
          : [candidate, targetReport];

      await prisma.matchCandidate.upsert({
        where: {
          reportAId_reportBId: {
            reportAId: firstReport.id,
            reportBId: secondReport.id,
          },
        },
        create: {
          communityId: targetReport.communityId,
          reportAId: firstReport.id,
          reportBId: secondReport.id,
          status: "ACTIVE",
          score,
          scoreBreakdown: breakdown as any,
          algorithmVersion: ALGORITHM_VERSION,
          reportAVersion: firstReport.version,
          reportBVersion: secondReport.version,
        },
        update: {
          score,
          scoreBreakdown: breakdown as any,
          status: "ACTIVE",
          lastScoredAt: new Date(),
        },
      });
    }
  }
}

// Polling Daemon & Graceful Shutdown
let isRunning = false;

export async function startWorker(options: { pollIntervalMs?: number; singleRun?: boolean } = {}) {
  const pollIntervalMs = options.pollIntervalMs || Number(process.env.WORKER_POLL_INTERVAL_MS || 3000);
  const workerId = `worker-${process.pid}`;

  isRunning = true;
  console.log(`[Worker ${workerId}] Matching worker daemon started (Interval: ${pollIntervalMs}ms)`);

  const shutdown = async (signal: string) => {
    console.log(`[Worker ${workerId}] Received ${signal}. Initiating graceful shutdown...`);
    isRunning = false;
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  while (isRunning) {
    try {
      const { processed, errors } = await processMatchingJobs(workerId);
      if (processed > 0 || errors > 0) {
        console.log(`[Worker ${workerId}] Processed ${processed} job(s), ${errors} error(s)`);
      }
    } catch (err) {
      console.error(`[Worker ${workerId}] Unhandled cycle error:`, err);
    }

    if (options.singleRun) {
      break;
    }

    if (isRunning) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  console.log(`[Worker ${workerId}] Worker shutdown complete. Clean exit.`);
}

// Auto-start if invoked directly via CLI or container CMD
const isDirectExecution =
  process.argv[1] &&
  (pathToFileURL(process.argv[1]).href === import.meta.url ||
    process.argv[1].replace(/\\/g, "/").endsWith("jobs/worker.js") ||
    process.argv[1].replace(/\\/g, "/").endsWith("jobs/worker.ts"));

if (isDirectExecution) {
  startWorker().catch((err) => {
    console.error("Worker fatal error on startup:", err);
    process.exit(1);
  });
}
