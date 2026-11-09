# Week 5 — PWA dhe AI

## What I did

- Added Gemini vision integration behind `lib/ai/provider.ts`.
- Added a fallback result when the API key is missing or Gemini fails, so a citizen can still submit a report.
- Added Albanian AI output validation with a strict Zod schema.
- Added report flow screens, an AI analysis hint, install manifest and a cached offline shell.
- Added visible status and map affordances for the interim demo.

## Test demo

Submit a valid JSON payload to `POST /api/reports`. Without `GEMINI_API_KEY`, the response is marked `ai_status: "failed"` but remains usable.
