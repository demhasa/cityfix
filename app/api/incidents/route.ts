import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { incidentAssignments, incidentLikes, incidents, municipalities, reports, teams } from "@/db/schema";

export const dynamic = "force-dynamic";

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
    const ids = rows.map((row) => row.id);
    const [photos, likes, assignments] = ids.length ? await Promise.all([
      db.select({ incidentId: reports.incidentId, photoUrl: reports.photoUrl }).from(reports).where(inArray(reports.incidentId, ids)),
      db.select({ incidentId: incidentLikes.incidentId }).from(incidentLikes).where(inArray(incidentLikes.incidentId, ids)),
      db.select({ incidentId: incidentAssignments.incidentId, teamName: teams.name }).from(incidentAssignments).innerJoin(teams, eq(incidentAssignments.teamId, teams.id)).where(inArray(incidentAssignments.incidentId, ids)),
    ]) : [[], [], []];
    const photoByIncident = new Map<string, string>();
    photos.forEach((photo) => { if (photo.photoUrl && !photoByIncident.has(photo.incidentId)) photoByIncident.set(photo.incidentId, photo.photoUrl); });
    const likeCounts = new Map<string, number>();
    likes.forEach((like) => likeCounts.set(like.incidentId, (likeCounts.get(like.incidentId) ?? 0) + 1));
    const assignedTeams = new Map(assignments.map((assignment) => [assignment.incidentId, assignment.teamName]));
    return NextResponse.json({ incidents: rows.map((row) => ({ ...row, imageUrl: photoByIncident.get(row.id) ?? null, likes: likeCounts.get(row.id) ?? 0, assignedTeam: assignedTeams.get(row.id) ?? null })) });
  } catch (error) {
    console.error("Failed to load incidents", error);
    return NextResponse.json({ error: "Incidentet nuk mund të lexohen nga databaza." }, { status: 503 });
  }
}
