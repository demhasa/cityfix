import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { incidentAssignments, teams } from "@/db/schema";

const assignmentSchema = z.object({ teamId: z.string().uuid() });

export async function POST(request: Request, context: RouteContext<"/api/incidents/[id]/assign">) {
  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ekipi nuk është valid." }, { status: 400 });
  try {
    const { id: incidentId } = await context.params;
    const db = getDb();
    const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, parsed.data.teamId)).limit(1);
    if (!team) return NextResponse.json({ error: "Ekipi nuk u gjet." }, { status: 404 });
    await db.delete(incidentAssignments).where(eq(incidentAssignments.incidentId, incidentId));
    await db.insert(incidentAssignments).values({ incidentId, teamId: team.id });
    return NextResponse.json({ assigned: true });
  } catch (error) {
    console.error("Failed to assign incident", error);
    return NextResponse.json({ error: "Ekipi nuk mund të caktohet." }, { status: 503 });
  }
}
