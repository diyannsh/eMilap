CREATE TABLE item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES item_reports(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  purpose text NOT NULL DEFAULT 'REPORT',
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  width_px integer,
  height_px integer,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  moderation_state text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT image_size_positive CHECK (byte_size > 0),
  CONSTRAINT image_mime_allowed CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  CONSTRAINT image_purpose_allowed CHECK (purpose IN ('REPORT','CLAIM_EVIDENCE'))
);
CREATE INDEX item_images_report_idx ON item_images(report_id, sort_order);

CREATE TABLE item_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES item_reports(id) ON DELETE CASCADE,
  name text NOT NULL,
  normalized_value text NOT NULL,
  visibility text NOT NULL DEFAULT 'PUBLIC',
  source text NOT NULL DEFAULT 'USER',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attribute_visibility CHECK (visibility IN ('PUBLIC','PRIVATE')),
  CONSTRAINT attribute_source CHECK (source IN ('USER','AI')),
  CONSTRAINT attribute_unique UNIQUE (report_id, name, normalized_value)
);
CREATE INDEX item_attributes_name_value_idx ON item_attributes(name, normalized_value);
