CREATE TABLE matching_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES item_reports(id) ON DELETE CASCADE,
  report_version integer NOT NULL,
  status job_status NOT NULL DEFAULT 'PENDING',
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_attempts_nonnegative CHECK (attempts >= 0),
  CONSTRAINT matching_job_version_unique UNIQUE(report_id, report_version)
);
CREATE INDEX matching_jobs_ready_idx ON matching_jobs(available_at, created_at)
  WHERE status IN ('PENDING','RETRY');
