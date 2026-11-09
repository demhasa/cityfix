# CityFix

CityFix is a mobile-first municipal issue reporting platform for the Prishtina and Deçan pilot municipalities. Citizens submit a photo and location; AI proposes an Albanian report, while municipal teams triage incidents by transparent priority score.

## Features in this build

- Albanian citizen PWA shell with bottom navigation, report flow, map preview, reports, profile, offline service worker and install manifest.
- Responsive `/admin` dashboard with KPI cards, urgent incidents, chart and municipality scope.
- Drizzle/Postgres schema for municipalities, users, incidents, reports, status history, notifications and sensitive places.
- Zod-validated report API and provider abstraction with Gemini vision integration plus a safe fallback when no key is configured.
- Unit tests for duplicate detection, priority scoring and AI output validation.

## Local development

Requires Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/admin](http://localhost:3000/admin).

Copy `.env.example` to `.env.local` for services. `DATABASE_URL` is required for database-backed incidents. `GEMINI_API_KEY` enables real Gemini image analysis; reports remain submittable with an explicit fallback status when it is absent.

## Validation

```bash
npm run lint
npm test
npm run build
```
The production deployment is available at [cityfix-phi.vercel.app](https://cityfix-phi.vercel.app). The GitHub repository is connected to Vercel for future deployments. Production secrets are configured in Vercel, while local secrets remain in ignored `.env.local`.
