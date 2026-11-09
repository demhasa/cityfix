# CityFix API

## `POST /api/reports`

Pranon një raport të ri. Payload:

```json
{
  "title": "Gropë në rrugë",
  "description": "Gropë e madhe pranë trotuarit.",
  "category": "pothole",
  "lat": 42.662,
  "lng": 21.165,
  "imageUrl": "https://example.com/photo.jpg"
}
```

Kthen `201` me incidentin, analizën AI dhe `ai_status`. Payload i pavlefshëm kthen `400`; mungesa e AI-së përdor fallback dhe e shënon raportin `failed`.
