import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { reportInputSchema } from "@/lib/domain";
import { getAiProvider } from "@/lib/ai/provider";
import { getDb } from "@/db";
import { incidents, municipalities, reports } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = request.headers.get("x-cityfix-user");
  if (!userId) return NextResponse.json({ reports: [] });
  try {
    const rows = await getDb().select({
      id: reports.id,
      title: incidents.title,
      category: incidents.category,
      status: incidents.status,
      createdAt: reports.createdAt,
    }).from(reports).innerJoin(incidents, eq(reports.incidentId, incidents.id))
      .where(eq(reports.reporterId, userId)).orderBy(desc(reports.createdAt)).limit(50);
    return NextResponse.json({ reports: rows });
  } catch (error) {
    console.error("Failed to load user reports", error);
    return NextResponse.json({ error: "Raportet nuk mund të lexohen." }, { status: 503 });
  }
}

export async function analyzeReport(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = reportInputSchema.pick({ imageUrl: true, category: true }).safeParse(body);
  if (!parsed.success || !parsed.data.imageUrl) return NextResponse.json({ error: "Fotografia mungon ose nuk është valide." }, { status: 400 });
  const ai = await getAiProvider().analyzeImage(parsed.data.imageUrl, `Category hint: ${parsed.data.category}`);
  return NextResponse.json({ ai, ai_status: process.env.GEMINI_API_KEY ? "complete" : "failed" });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = reportInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Të dhënat e raportit nuk janë valide.", issues: parsed.error.flatten() }, { status: 400 });
  const ai = await getAiProvider().analyzeImage(parsed.data.imageUrl ?? "", `Category hint: ${parsed.data.category}`);
  try {
    const db = getDb();
    const municipality = await db.select({ id: municipalities.id }).from(municipalities).where(eq(municipalities.slug, "prishtina")).limit(1);
    if (!municipality[0]) return NextResponse.json({ error: "Komuna nuk është konfiguruar." }, { status: 503 });
    const reporterId = request.headers.get("x-cityfix-user") || undefined;
    const [incident] = await db.insert(incidents).values({
      municipalityId: municipality[0].id,
      category: ai.category,
      title: ai.title,
      description: ai.description,
      priority: ai.suggested_priority === "urgent" ? "urgent" : ai.suggested_priority,
      priorityScore: ai.danger_level * 10,
      priorityBreakdown: ai,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    }).returning();
    await db.insert(reports).values({
      incidentId: incident.id,
      reporterId,
      photoUrl: parsed.data.imageUrl,
      aiJson: ai,
      aiStatus: process.env.GEMINI_API_KEY ? "complete" : "failed",
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    });
    return NextResponse.json({ incident: { ...incident, ai, ai_status: process.env.GEMINI_API_KEY ? "complete" : "failed" } }, { status: 201 });
  } catch (error) {
    console.error("Failed to save report", error);
    return NextResponse.json({ error: "Raporti u analizua, por nuk u ruajt në databazë." }, { status: 503 });
  }
}
