# CityFix

CityFix is a municipal issue reporting platform for the Prishtina and Deçan pilot municipalities.

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` when backend services are configured. Never commit `.env.local` or production credentials.

## Project structure

- `app/` — Next.js App Router pages and API routes
- `components/` — shared UI components
- `db/` — database schema, migrations, and seed data
- `lib/` — shared application services
- `docs/` — system design and project documentation

## Validation

```bash
npm run lint
npm run build
```
