# Milestone 13 — Evaluation Guide (FoundNear AI)

## What works
- Deterministic matcher (M7) with documented weights.
- Database schema supports versioned embeddings, match pairs, audit logs.
- Synthetic fixtures in fixtures/evaluation-cases.json cover blueprint cases.

## What is blocked / not verified
- Real embeddings: placeholder zero vectors (M8) — must not count.
- Uploads: MinIO unavailable (Docker daemon down) — evidence upload blocked.
- Runtime tests: npm install + Docker needed; not available in this environment.
- Real evaluation data: requires consented pilot per blueprint.

## Commands to run when environment allows
```powershell
# Start infra
cd C:\Users\NIRBHAY\Desktop\eMilap
docker compose -f infra/compose.yaml up -d

# Build / test
cd apps/api && npm install && npm run typecheck && npm test
cd apps/web && npm install && npm run build

# Run evaluation fixtures (manual)
node fixtures/validate-cases.js  # add when fixtures formalized
```

## Metrics (from blueprint Part 1/2)
- Precision@5, Recall known pairs, False-match rate, Confirmed recovery rate.
- Track via moderator-reviewed outcomes, not just user rejection.
