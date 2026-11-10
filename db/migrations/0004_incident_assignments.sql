CREATE TABLE IF NOT EXISTS incident_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id),
  assigned_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT incident_assignments_unique_incident UNIQUE (incident_id)
);
