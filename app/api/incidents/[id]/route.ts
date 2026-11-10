import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { incidentAssignments, incidentLikes, incidents, notifications, reports, statusHistory } from "@/db/schema";

const statusSchema = z.object({ status: z.enum(["new", "in_progress", "resolved"]) });

export async function PATCH(request: Request, context: RouteContext<"/api/incidents/[id]">) {
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Statusi nuk është valid." }, { status: 400 });
  try {
    const { id } = await context.params;
    const [incident] = await getDb().update(incidents).set({ status: parsed.data.status, resolvedAt: parsed.data.status === "resolved" ? new Date() : null }).where(eq(incidents.id, id)).returning();
    if (!incident) return NextResponse.json({ error: "Incident nuk u gjet." }, { status: 404 });
    return NextResponse.json({ incident });
  } catch (error) {
    console.error("Failed to update incident", error);
    return NextResponse.json({ error: "Incidenti nuk u përditësua." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/incidents/[id]">) {
  try {
    const { id } = await context.params;
    const db = getDb();
    const [existing] = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Incidenti nuk u gjet." }, { status: 404 });
    await db.delete(reports).where(eq(reports.incidentId, id));
    await db.delete(statusHistory).where(eq(statusHistory.incidentId, id));
    await db.delete(notifications).where(eq(notifications.incidentId, id));
    await db.delete(incidentLikes).where(eq(incidentLikes.incidentId, id));
    await db.delete(incidentAssignments).where(eq(incidentAssignments.incidentId, id));
    await db.delete(incidents).where(eq(incidents.id, id));
    return NextResponse.json({ deleted: id });
  } catch (error) {
    console.error("Failed to delete incident", error);
    return NextResponse.json({ error: "Incidenti nuk mund të fshihet." }, { status: 503 });
  }
}
