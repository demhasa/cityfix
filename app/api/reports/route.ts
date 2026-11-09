import { NextResponse } from "next/server";
import { reportInputSchema } from "@/lib/domain";
import { getAiProvider } from "@/lib/ai/provider";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = reportInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Të dhënat e raportit nuk janë valide.", issues: parsed.error.flatten() }, { status: 400 });
  const ai = await getAiProvider().analyzeImage(parsed.data.imageUrl ?? "", `Category hint: ${parsed.data.category}`);
  return NextResponse.json({ incident: { id: `CF-${Date.now().toString().slice(-5)}`, ...parsed.data, ai, status: "new", ai_status: process.env.GEMINI_API_KEY ? "complete" : "failed" } }, { status: 201 });
}
