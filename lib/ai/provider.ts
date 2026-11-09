import { aiResultSchema, type AiResult } from "@/lib/domain";

export type AiProvider = { analyzeImage: (image: string, context?: string) => Promise<AiResult> };

const fallback: AiResult = {
  category: "other", title: "Problem komunal i paidentifikuar",
  description: "Raporti u pranua, por analiza automatike nuk mundi ta identifikojë problemin. Ekipi komunal do ta shqyrtojë.",
  danger_level: 1, danger_reason: "Kërkon verifikim nga komuna.", suggested_priority: "normal", confidence: 0, is_valid_municipal_issue: true,
};

export function getAiProvider(): AiProvider {
  return { analyzeImage: async (image, context) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return fallback;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Return only JSON matching the CityFix issue schema. Language: Albanian. Context: ${context ?? "none"}` }, { inline_data: { mime_type: "image/jpeg", data: image.replace(/^data:image\/\w+;base64,/, "") } }] }] }),
      });
      if (!response.ok) return fallback;
      const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim();
      return text ? aiResultSchema.parse(JSON.parse(text)) : fallback;
    } catch { return fallback; }
  }};
}
