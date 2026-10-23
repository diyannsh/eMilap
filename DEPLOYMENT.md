# FoundNear AI — deployment preparation

This document is a preparation checklist, not a deployment record. No live resources have been changed.

## Production configuration

Set secrets through the hosting platform's secret manager; do not copy development values from `.env.example` into production. Required settings:

- `NODE_ENV=production`, `PORT`, `WEB_ORIGIN`
- `DATABASE_URL` for managed PostgreSQL with the pgvector extension enabled
- `SESSION_SECRET` generated randomly (at least 32 characters), `SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS`
- `S3_REGION`, `S3_BUCKET_REPORTS`, `S3_BUCKET_EVIDENCE`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT` only when the provider requires a custom endpoint; omit it for standard AWS S3
- `S3_FORCE_PATH_STYLE=false` for AWS S3; set true only for providers requiring path-style addressing
- `AI_SERVICE_URL` and `AI_SERVICE_TOKEN` only when an actual embedding provider is configured; zero-vector placeholder output is not usable

The `S3_*` names are provider-neutral configuration. Use distinct private buckets or equivalent access policies for report images and claim evidence. Evidence must not have public-read access. Apply least-privilege credentials, encryption at rest, TLS, lifecycle/retention policies, and provider-side access logging. The current upload routes return `STORAGE_UNAVAILABLE`; configuring these variables alone does not make uploads work. Signed-upload integration and authorization tests remain required before enabling uploads.

## Development database setup

Compose is for local development only. Start the database (and local object storage only if its image is available):

```powershell
docker compose -f infra/compose.yaml up -d postgres
```

Apply SQL migrations in numeric order. For an already running Compose database, from the project root in PowerShell:

```powershell
Get-ChildItem database/migrations/*.sql | Sort-Object Name | ForEach-Object {
  Get-Content -Raw $_.FullName | docker compose -f infra/compose.yaml exec -T postgres psql -U foundnear -d foundnear -v ON_ERROR_STOP=1
}
```

Seed only a disposable local database:

```powershell
Get-Content -Raw database/seeds/demo.sql | docker compose -f infra/compose.yaml exec -T postgres psql -U foundnear -d foundnear -v ON_ERROR_STOP=1
```

The seed contains synthetic demo records and must not be run against production.

## Production migrations and seed policy

Use a managed PostgreSQL instance with backups enabled and pgvector installed. Review each SQL migration and its rollback/restore plan, take a verified pre-migration backup, then apply `database/migrations/*.sql` in numeric order through the provider's approved migration runner or `psql` over TLS with `ON_ERROR_STOP=1`. Record migration checksums and applied versions in the deployment's migration ledger. The repository currently has ordered SQL files, not a Prisma migration history/runner; do not use `prisma migrate deploy` as a substitute. Never run `database/seeds/demo.sql` in production.

## Backup and restore

Use provider-managed automated backups/PITR as the primary recovery mechanism. Periodically test restore into an isolated database and verify row counts, required extensions, and application readiness. For a manual logical backup with PostgreSQL client tools:

```powershell
pg_dump --format=custom --no-owner --no-privileges --dbname $env:DATABASE_URL --file foundnear-backup.dump
```

Restore only into a confirmed target database after approval and an independent backup:

```powershell
pg_restore --clean --if-exists --no-owner --no-privileges --dbname $env:RESTORE_DATABASE_URL foundnear-backup.dump
```

Protect backup files as sensitive data, encrypt them, restrict access, and define retention. Database backups do not include S3 objects; configure object versioning/backup and test restoration separately, including private-evidence access controls.

## Health, logs, and operations

- API liveness: `GET /health/live`; readiness: `GET /health/ready` (database dependency).
- AI liveness/readiness: `GET /health/live` and `/health/ready`; AI is optional and must not gate deterministic matching.
- Configure platform probes to use liveness for restart decisions and readiness for traffic admission. Confirm readiness returns a non-success status when required dependencies are unavailable before production.
- Send process output to the platform's centralized log service with access controls and retention. Do not log passwords, session cookies, private report details, claim evidence, signed URLs, or credentials.
- Alert on failed health checks, database/storage errors, backup failures, and job backlog. The matching worker currently contains placeholder processing and must be made operational and tested before deployment.

## Manual gates before a real deployment

1. Implement and integration-test provider-neutral signed S3 uploads/downloads; verify private evidence cannot be fetched publicly.
2. Finish and test authentication, community authorization, claims, moderation, matching worker, and notifications against a real local/managed-like setup; several existing routes are placeholders.
3. Add CSRF protection and rate limits; verify production session settings and persistent session storage.
4. Validate all environment variables at startup and fail fast for missing production settings. Current API configuration does not yet do this comprehensively.
5. Run tests, migrations, backup/restore drills, vulnerability review, secret review, and a security/privacy review.
6. Configure TLS, managed database, object-storage policies, backups/PITR, monitoring, logging, retention, and an approved release process.
7. Confirm a Git repository and reviewable CI pipeline before enabling automated release steps. This checkout has no `.git` directory, so no pipeline was added.

## Current limitations

- Local MinIO pull is blocked in this environment; report-image and claim-evidence upload flows remain unverified and currently respond unavailable.
- No deployment or publication was performed.
- Production readiness is not verified; this repository is at deployment-preparation stage only.
