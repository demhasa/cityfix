import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { incidents } from "@/db/schema";

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
