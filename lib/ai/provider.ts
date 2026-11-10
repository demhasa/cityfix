import { aiResultSchema, type AiResult } from "@/lib/domain";

export type AiProvider = {
  analyzeImage: (image: string, context?: string) => Promise<AiResult>;
};

function serviceUrl() {
  return process.env.AI_SERVICE_URL?.replace(/\/$/, "");
}

function imageParts(image: string) {
  const match = image.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!match) throw new Error("Unsupported image data.");
  return { mimeType: match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase(), data: Buffer.from(match[2], "base64") };
}

export function getAiProvider(): AiProvider {
  return {
    analyzeImage: async (image, context) => {
      if (process.env.AI_ENABLED !== "true") throw new Error("Local AI is disabled.");
      const url = serviceUrl();
      if (!url) throw new Error("AI_SERVICE_URL is not configured.");
      const form = new FormData();
      const part = imageParts(image);
      form.append("description", context ?? "");
      form.append("language", "sq");
      form.append("photographs", new Blob([part.data], { type: part.mimeType }), "report-image");
      const headers = process.env.AI_SERVICE_SECRET ? { "x-cityfix-ai-secret": process.env.AI_SERVICE_SECRET } : undefined;
      const response = await fetch(`${url}/analyze`, { method: "POST", headers, body: form, signal: AbortSignal.timeout(125_000) });
      if (!response.ok) throw new Error(`Local AI returned ${response.status}.`);
      return aiResultSchema.parse(await response.json());
    },
  };
}
