CREATE TABLE item_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE RESTRICT,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  report_type report_type NOT NULL,
  status report_status NOT NULL DEFAULT 'OPEN',
  title text NOT NULL,
  public_description text NOT NULL,
  category text NOT NULL,
  color text,
  brand text,
  approximate_location text,
  occurred_at timestamptz,
  occurred_at_is_approximate boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  removed_at timestamptz,
  CONSTRAINT report_title_nonempty CHECK (length(trim(title)) BETWEEN 2 AND 120),
  CONSTRAINT report_description_nonempty CHECK (length(trim(public_description)) BETWEEN 5 AND 5000),
  CONSTRAINT report_category_nonempty CHECK (length(trim(category)) > 0),
  CONSTRAINT report_version_positive CHECK (version > 0),
  CONSTRAINT report_resolved_timestamp CHECK ((status <> 'RESOLVED') OR resolved_at IS NOT NULL)
);
CREATE INDEX reports_community_type_status_idx ON item_reports(community_id, report_type, status, created_at DESC);
CREATE INDEX reports_reporter_created_idx ON item_reports(reporter_id, created_at DESC);
CREATE INDEX reports_occurred_at_idx ON item_reports(community_id, occurred_at);
CREATE INDEX reports_location_idx ON item_reports USING gin (to_tsvector('simple', coalesce(approximate_location, '')));

CREATE TABLE private_report_details (
  report_id uuid PRIMARY KEY REFERENCES item_reports(id) ON DELETE CASCADE,
  details_ciphertext bytea NOT NULL,
  encryption_key_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
