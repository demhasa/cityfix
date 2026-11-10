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
      const result = await db.transaction(async (tx) => {
        await tx.delete(reports).where(eq(reports.incidentId, id));
        await tx.delete(statusHistory).where(eq(statusHistory.incidentId, id));
        await tx.delete(notifications).where(eq(notifications.incidentId, id));
        await tx.delete(incidentLikes).where(eq(incidentLikes.incidentId, id));
        await tx.delete(incidentAssignments).where(eq(incidentAssignments.incidentId, id));
        return tx.delete(incidents).where(eq(incidents.id, id)).returning({ id: incidents.id });
      });
      if (!result[0]) return NextResponse.json({ error: "Incidenti nuk u gjet." }, { status: 404 });
      return NextResponse.json({ deleted: result[0].id });
    } catch (error) {
      console.error("Failed to delete incident", error);
      return NextResponse.json({ error: "Incidenti nuk mund të fshihet." }, { status: 503 });
  }
}
