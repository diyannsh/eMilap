-- 10_session_table.sql: Persistent HTTP sessions table for connect-pg-simple
CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);
