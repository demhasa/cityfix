ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS surname text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood text;

UPDATE users
SET personal_number = COALESCE(personal_number, 'LEGACY-' || id::text),
    surname = COALESCE(surname, ''),
    neighborhood = COALESCE(neighborhood, 'Prishtina')
WHERE personal_number IS NULL OR surname IS NULL OR neighborhood IS NULL;

ALTER TABLE users ALTER COLUMN personal_number SET NOT NULL;
ALTER TABLE users ALTER COLUMN surname SET NOT NULL;
ALTER TABLE users ALTER COLUMN neighborhood SET NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_personal_number_unique ON users (personal_number);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone) WHERE phone IS NOT NULL;
