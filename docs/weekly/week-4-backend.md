# Week 4 — Backend dhe databaza

## What I did

- Added the Drizzle/Postgres schema for municipalities, users, incidents, reports, status history, notifications and sensitive places.
- Added a Drizzle Kit configuration ready for Neon migrations.
- Created the `cityfix` Neon project and applied the initial schema to its production branch.
- Added the first validated `POST /api/reports` endpoint.
- Added Zod input validation and a safe response for invalid payloads.
- Added an AI provider boundary so the API does not depend directly on one vendor.

## Environment

The Neon `DATABASE_URL` is stored only in ignored `.env.local` locally and as a sensitive Production variable in Vercel. No connection string is included in Git.
