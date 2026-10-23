CREATE TABLE ownership_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES item_reports(id) ON DELETE RESTRICT,
  claimant_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status claim_status NOT NULL DEFAULT 'SUBMITTED',
  message text NOT NULL,
  reviewer_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  decision_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT claim_message_nonempty CHECK (length(trim(message)) BETWEEN 5 AND 3000)
);
CREATE INDEX claims_report_status_idx ON ownership_claims(report_id, status, submitted_at);
CREATE INDEX claims_claimant_idx ON ownership_claims(claimant_id, submitted_at DESC);

CREATE TABLE claim_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES ownership_claims(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  evidence_type text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_size_positive CHECK (byte_size > 0),
  CONSTRAINT evidence_type_valid CHECK (evidence_type IN ('TEXT','IMAGE','DOCUMENT'))
);
