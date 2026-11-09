# Week 4 — Backend dhe databaza

## What I did

- Added the Drizzle/Postgres schema for municipalities, users, incidents, reports, status history, notifications and sensitive places.
- Added a Drizzle Kit configuration ready for Neon migrations.
- Added the first validated `POST /api/reports` endpoint.
- Added Zod input validation and a safe response for invalid payloads.
- Added an AI provider boundary so the API does not depend directly on one vendor.

## Environment

The schema is ready for `DATABASE_URL`. The local API intentionally returns a safe in-memory response until the Neon connection is configured.
