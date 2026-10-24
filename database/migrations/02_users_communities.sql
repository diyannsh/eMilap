-- Users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  email_verified_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_display_name_nonempty CHECK (length(trim(display_name)) > 0)
);

CREATE TABLE communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  timezone text NOT NULL DEFAULT 'UTC',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communities_slug_format CHECK (slug ~ '^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$'),
  CONSTRAINT communities_name_nonempty CHECK (length(trim(name)) > 0)
);

CREATE TABLE community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  role community_role NOT NULL DEFAULT 'MEMBER',
  status membership_status NOT NULL DEFAULT 'ACTIVE',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT membership_user_community_unique UNIQUE (user_id, community_id)
);
CREATE INDEX memberships_community_status_idx ON community_memberships(community_id, status);
CREATE INDEX memberships_user_status_idx ON community_memberships(user_id, status);
