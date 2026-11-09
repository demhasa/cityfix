CREATE TABLE IF NOT EXISTS municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  center_lat real NOT NULL,
  center_lng real NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid REFERENCES municipalities(id),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'citizen',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid NOT NULL REFERENCES municipalities(id),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'normal',
  priority_score integer NOT NULL DEFAULT 0,
  priority_breakdown jsonb,
  lat real NOT NULL,
  lng real NOT NULL,
  report_count integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  resolved_at timestamp
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id),
  reporter_id uuid REFERENCES users(id),
  photo_url text,
  image_hash text,
  ai_json jsonb,
  ai_status text NOT NULL DEFAULT 'pending',
  lat real NOT NULL,
  lng real NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id),
  changed_by uuid REFERENCES users(id),
  from_status text,
  to_status text NOT NULL,
  note text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  incident_id uuid REFERENCES incidents(id),
  title text NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sensitive_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid NOT NULL REFERENCES municipalities(id),
  name text NOT NULL,
  kind text NOT NULL,
  lat real NOT NULL,
  lng real NOT NULL,
  radius_meters integer NOT NULL DEFAULT 100
);
