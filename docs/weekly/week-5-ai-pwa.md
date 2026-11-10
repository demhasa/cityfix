# Week 5 — PWA dhe AI

## What I did

- Replaced hosted AI with optional local Qwen3-VL vision analysis behind `lib/ai/provider.ts`.
- Added a manual report path when local AI is disabled or unavailable.
- Added Albanian AI output validation with a strict Zod schema.
- Added report flow screens, an AI analysis hint, install manifest and a cached offline shell.
- Added a real camera permission request using `getUserMedia`, a rear-camera preference, gallery fallback and compressed JPEG capture.
- Added a real geolocation permission request, visible latitude/longitude confirmation and a submit button gated on location.
- Vercel keeps `AI_ENABLED=false`; local development uses `AI_SERVICE_URL=http://127.0.0.1:8001`.
- Added visible status and map affordances for the interim demo.

## Test demo

Submit a valid JSON payload to `POST /api/reports`. Without local AI, the response is marked `ai_status: "unavailable"` and remains usable.
