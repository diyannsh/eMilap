import { createApp } from "./app";
import { validateEnvironment } from "./config/env";
import { disconnectDatabase } from "./db/client";

// Validate environment configurations on startup
const envValidation = validateEnvironment();
if (envValidation.warnings.length > 0) {
  for (const warn of envValidation.warnings) {
    console.warn(`[e-Milap Config Warning]: ${warn}`);
  }
}

if (!envValidation.valid) {
  console.error("==================================================================");
  console.error("[e-Milap Fatal Error] Environment configuration validation failed:");
  for (const err of envValidation.errors) {
    console.error(`  - ${err}`);
  }
  console.error("Please configure the required environment variables and restart.");
  console.error("==================================================================");
  process.exit(1);
}

const app = createApp();
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`e-Milap API running on port ${PORT} [env: ${process.env.NODE_ENV || "development"}]`);
});

// Embedded matching worker for single-service deployments (e.g. Render Free tier)
if (process.env.EMBEDDED_WORKER === "true" || process.env.RUN_WORKER === "true") {
  import("./jobs/worker.js")
    .then(({ startWorker }) => {
      console.log("[e-Milap API] Embedded matching worker enabled for single-service deployment.");
      const pollInterval = Number(process.env.WORKER_POLL_INTERVAL_MS || 5000);
      startWorker({ pollIntervalMs: pollInterval }).catch((err) => {
        console.error("[e-Milap API] Embedded worker fatal error:", err);
      });
    })
    .catch((err) => {
      console.error("[e-Milap API] Failed to initialize embedded worker:", err);
    });
}

// Graceful shutdown handling for container orchestrators (SIGTERM, SIGINT)
let isShuttingDown = false;

async function handleGracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[e-Milap API] Received ${signal}, initiating graceful shutdown...`);

  server.close(async (closeErr) => {
    if (closeErr) {
      console.error("[e-Milap API] Error during HTTP server close:", closeErr);
    }
    try {
      await disconnectDatabase();
      console.log("[e-Milap API] Database connections cleanly closed.");
      process.exit(0);
    } catch (dbErr) {
      console.error("[e-Milap API] Error disconnecting database:", dbErr);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if connections linger
  setTimeout(() => {
    console.error("[e-Milap API] Graceful shutdown timeout (10s), forcing termination.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
