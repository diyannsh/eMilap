-- Demo seed data for local development only.
-- No real personal data; all names/items are synthetic.
-- Run after migrations. Use only in development/test environments.

INSERT INTO users (email, password_hash, display_name, created_at)
VALUES
  ('demo.user@foundnear.local', 'demo_hash_not_for_production', 'Demo User', now()),
  ('mod.host@foundnear.local', 'demo_hash_not_for_production', 'Host Moderator', now());

INSERT INTO communities (slug, name, description, is_active)
VALUES
  ('demo-hostel', 'Demo Hostel', 'Synthetic community for local testing.', true);

INSERT INTO community_memberships (user_id, community_id, role, status)
SELECT u.id, c.id, 'MEMBER', 'ACTIVE'
FROM users u, communities c WHERE u.email = 'demo.user@foundnear.local' AND c.slug = 'demo-hostel';

-- Minimal report seeds (synthetic items only)
INSERT INTO item_reports (community_id, reporter_id, report_type, status, title, public_description, category, color, approximate_location, occurred_at)
SELECT c.id, u.id, 'LOST', 'OPEN', 'Black backpack', 'Lost black canvas backpack.', 'BAG', 'black', 'Library, 2nd floor', now() - interval '2 days'
FROM users u, communities c WHERE u.email = 'demo.user@foundnear.local' AND c.slug = 'demo-hostel';
