CREATE TABLE IF NOT EXISTS incident_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT incident_likes_unique_user_incident UNIQUE (incident_id, user_id)
);

CREATE INDEX IF NOT EXISTS incident_likes_incident_idx ON incident_likes (incident_id);
CREATE INDEX IF NOT EXISTS incident_likes_user_idx ON incident_likes (user_id);
