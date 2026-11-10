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

Kthen `201` me incidentin dhe `ai_status`. Kur `AI_ENABLED=true`, analiza vjen nga shërbimi lokal Qwen3-VL; kur AI është e çaktivizuar ose offline, raporti manual ruhet me statusin `unavailable` pa krijuar analizë të rreme.
