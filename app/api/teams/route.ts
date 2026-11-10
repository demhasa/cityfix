import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { municipalities, teams } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getDb().select({
      id: teams.id, name: teams.name, specialty: teams.specialty, status: teams.status, leadName: teams.leadName,
    }).from(teams).innerJoin(municipalities, eq(teams.municipalityId, municipalities.id)).where(eq(municipalities.slug, "prishtina")).orderBy(asc(teams.name));
    return NextResponse.json({ teams: rows });
  } catch (error) {
    console.error("Failed to load teams", error);
    return NextResponse.json({ error: "Ekipet nuk mund të lexohen." }, { status: 503 });
  }
}
