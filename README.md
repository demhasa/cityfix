# CityFix

CityFix is a mobile-first municipal issue reporting platform for the Prishtina and Deçan pilot municipalities. Citizens submit a photo and location; AI proposes an Albanian report, while municipal teams triage incidents by transparent priority score.

## Features in this build

- Albanian citizen PWA shell with bottom navigation, report flow, map preview, reports, profile, offline service worker and install manifest.
- Responsive `/admin` dashboard with KPI cards, urgent incidents, chart and municipality scope.
- Drizzle/Postgres schema for municipalities, users, incidents, reports, status history, notifications and sensitive places.
- Zod-validated report API with optional local Qwen3-VL vision analysis through the FastAPI service in `ai-service/`.
- Citizens choose a problem category before AI analysis; the selection is sent as context and remains editable before submission.
- Profile registration/login with required personal number, name, surname and neighborhood; email or phone is optional (at least one contact is required).
- Interactive admin login and incident status controls at `/admin`.
- OpenFreeMap/MapLibre maps in the citizen app and admin panel, centered on Prishtina with live incident pins.
- Admin sections persist as hash routes such as `/admin#dashboard`, `/admin#incidents`, `/admin#teams`, `/admin#map`, and `/admin#reports`.
- Unit tests for duplicate detection, priority scoring and AI output validation.

## Local development

Requires Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/admin](http://localhost:3000/admin).

Copy `.env.example` to `.env.local` for services. `DATABASE_URL` is required for database-backed incidents. Set `AI_ENABLED=true` only while the local FastAPI/Ollama service is running; keep it `false` for Vercel. Reports remain submittable manually when local AI is unavailable.

See [`ai-service/README.md`](./ai-service/README.md) for Windows Python, Ollama and Qwen3-VL setup.

Run `npm run seed` after applying the migrations to create demo data and these test profiles:

- Citizen: personal number `1000000001`, password `CityFix123!`
- Admin: personal number `1000000002`, password `CityFix123!`

## Validation

```bash
npm run lint
npm test
npm run build
```
The production deployment is available at [cityfix-phi.vercel.app](https://cityfix-phi.vercel.app). The GitHub repository is connected to Vercel for future deployments. Production secrets are configured in Vercel, while local secrets remain in ignored `.env.local`.
