-- Embedding dimension decision (documented, configurable via model selection)
-- Default MVP placeholder: sentence-transformers/all-MiniLM-L6-v2 = 384 dims
-- If a different model is chosen, update dimensions AND recreate index.
-- Never mix dimensions in a single column.

CREATE TABLE item_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES item_reports(id) ON DELETE CASCADE,
  modality text NOT NULL DEFAULT 'TEXT',
  provider text NOT NULL,
  model_name text NOT NULL,
  model_version text NOT NULL,
  dimensions integer NOT NULL,
  embedding vector(384) NOT NULL,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT embedding_modality CHECK (modality IN ('TEXT','IMAGE')),
  CONSTRAINT embedding_dimensions CHECK (dimensions = 384),
  CONSTRAINT embedding_identity_unique UNIQUE (report_id, modality, provider, model_name, model_version, content_hash)
);
CREATE INDEX item_embeddings_report_idx ON item_embeddings(report_id);

-- HNSW index for cosine similarity (pgvector >= 0.5.0). Defer until dataset is large.
CREATE INDEX item_embeddings_vector_hnsw_idx ON item_embeddings USING hnsw (embedding vector_cosine_ops);
