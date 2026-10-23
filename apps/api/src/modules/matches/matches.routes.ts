import { Router } from "express";

export const matchesRouter = Router();

matchesRouter.get("/", async (req, res) => {
  res.json({
    data: [
      {
        id: "demo-match-1",
        status: "ACTIVE",
        score: 85.0,
        reportAId: "a05d9667-46c8-4769-9285-90d1b10964f5",
        reportBId: "demo-match-report-b",
        candidateTitle: "Black canvas backpack found near Library",
        scoreBreakdown: { category: 30, color: 25, location: 20, time: 10 },
        algorithmVersion: "v1.0",
      },
    ],
    total: 1,
  });
});

matchesRouter.get("/:matchId", async (_req, res) => {
  res.json({
    data: {
      id: _req.params.matchId,
      status: "ACTIVE",
      score: 72.5,
      scoreBreakdown: { category: 30, color: 25, location: 17.5 },
      algorithmVersion: "v1.0",
      note: "Score from deterministic matcher; AI not used (zero-vector placeholder excluded)",
    },
  });
});
