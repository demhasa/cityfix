CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid NOT NULL REFERENCES municipalities(id),
  name text NOT NULL,
  specialty text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  lead_name text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
