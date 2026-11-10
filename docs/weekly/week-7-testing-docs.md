# Week 7 — Testimi dhe dokumentimi

## What I did

- Added Vitest tests for duplicate matching, priority score limits and malformed AI output.
- Added API documentation and the complete Albanian system design document.
- Added the project README with local setup, validation and deployment notes.
- Re-ran lint, tests and the production build after the final changes.

## Results

- `npm test`: 3 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `/`, `/admin` and `/api/reports` were smoke-tested locally.

## External setup still required

Neon and Vercel configuration must be completed by the project owner before production deployment. Local AI additionally requires Ollama and Qwen3-VL on the development PC.
