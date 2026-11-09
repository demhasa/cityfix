import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { incidents, municipalities } from "@/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select({
      id: incidents.id,
      title: incidents.title,
      category: incidents.category,
      status: incidents.status,
      priority: incidents.priority,
      area: municipalities.name,
      reports: incidents.reportCount,
      time: incidents.createdAt,
      description: incidents.description,
      lat: incidents.lat,
      lng: incidents.lng,
      aiStatus: incidents.priorityBreakdown,
    }).from(incidents).innerJoin(municipalities, eq(incidents.municipalityId, municipalities.id)).orderBy(desc(incidents.createdAt)).limit(50);
    return NextResponse.json({ incidents: rows });
  } catch (error) {
    console.error("Failed to load incidents", error);
    return NextResponse.json({ error: "Incidentet nuk mund të lexohen nga databaza." }, { status: 503 });
  }
}
