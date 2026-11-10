# CityFix — Projektimi i sistemit

## Përmbledhje

CityFix është platformë mobile-first për raportimin e problemeve komunale në Prishtinë dhe Deçan. Qytetari fotografon problemin, jep lokacionin dhe merr një përshkrim fillestar në shqip nga AI. Komuna i menaxhon incidentet në panelin administrativ.

## Arkitektura

```mermaid
flowchart LR
  PWA[CityFix PWA] --> API[Next.js API Routes]
  API --> DB[(Neon Postgres + Drizzle)]
  API --> BLOB[Vercel Blob]
  API --> AI[Local FastAPI + Ollama Qwen3-VL]
  API --> PUSH[Web Push]
  ADMIN[Paneli i komunës] --> API
```

## Rast përdorimi

```mermaid
flowchart LR
  C[Qytetari] --> R(Raporton problem)
  C --> F(Ndjek statusin)
  A[Admin/Worker] --> M(Menaxhon incidentet)
  A --> S(Ndryshon statusin)
  R --> AI(Analizë fotoje)
  R --> D(Detektim dublikatesh)
```

## Sekuenca e raportimit

```mermaid
sequenceDiagram
  participant C as Qytetari
  participant P as PWA
  participant API as API
  participant AI as Local AI service
  participant DB as Neon
  C->>P: Fotografon problemin
  P->>API: POST /api/reports
  API->>AI: Analizo foton
  AI-->>API: JSON i validuar me Zod
  API->>DB: Ruaj incidentin/raportin
  API-->>P: Incidenti dhe statusi
```

## Modeli i të dhënave

```mermaid
erDiagram
  MUNICIPALITIES ||--o{ USERS : contains
  MUNICIPALITIES ||--o{ INCIDENTS : owns
  INCIDENTS ||--o{ REPORTS : groups
  INCIDENTS ||--o{ STATUS_HISTORY : tracks
  USERS ||--o{ NOTIFICATIONS : receives
  MUNICIPALITIES ||--o{ SENSITIVE_PLACES : configures
```

## Vendimet teknike

- Next.js App Router dhe TypeScript: UI dhe API në një repo, me deploy të thjeshtë në Vercel.
- Neon + Drizzle: PostgreSQL pa server të dedikuar dhe queries të parametrizuara.
- Zod: çdo payload i API-së validohet para përdorimit.
- Local AI is enabled only during local development; Vercel keeps `AI_ENABLED=false` and never calls the personal PC.
- Dështimi ose mungesa e AI-së nuk e bllokon raportin manual dhe ruhet me statusin `unavailable`.
- Algoritmet e dublikateve dhe prioritetit janë të ndara në `lib/domain.ts` dhe të testueshme pa databazë.
