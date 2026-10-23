CREATE TABLE match_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE RESTRICT,
  report_a_id uuid NOT NULL REFERENCES item_reports(id) ON DELETE CASCADE,
  report_b_id uuid NOT NULL REFERENCES item_reports(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'ACTIVE',
  score numeric(5,2) NOT NULL,
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  algorithm_version text NOT NULL,
  report_a_version integer NOT NULL,
  report_b_version integer NOT NULL,
  last_scored_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_pair_order CHECK (report_a_id < report_b_id),
  CONSTRAINT match_pair_unique UNIQUE (report_a_id, report_b_id),
  CONSTRAINT match_score_range CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT match_versions_positive CHECK (report_a_version > 0 AND report_b_version > 0)
);
CREATE INDEX matches_community_score_idx ON match_candidates(community_id, score DESC) WHERE status = 'ACTIVE';
CREATE INDEX matches_report_a_idx ON match_candidates(report_a_id, score DESC);
CREATE INDEX matches_report_b_idx ON match_candidates(report_b_id, score DESC);
