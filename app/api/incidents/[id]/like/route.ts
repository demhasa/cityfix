import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { incidentLikes } from "@/db/schema";

export async function POST(request: Request, context: RouteContext<"/api/incidents/[id]/like">) {
  const userId = request.headers.get("x-cityfix-user");
  if (!userId) return NextResponse.json({ error: "Hyr për të pëlqyer një problem." }, { status: 401 });
  const { id: incidentId } = await context.params;
  try {
    const db = getDb();
    const [existing] = await db.select({ id: incidentLikes.id }).from(incidentLikes)
      .where(and(eq(incidentLikes.incidentId, incidentId), eq(incidentLikes.userId, userId))).limit(1);
    if (existing) await db.delete(incidentLikes).where(eq(incidentLikes.id, existing.id));
    else await db.insert(incidentLikes).values({ incidentId, userId });
    const current = await db.select({ id: incidentLikes.id }).from(incidentLikes).where(eq(incidentLikes.incidentId, incidentId));
    return NextResponse.json({ liked: !existing, likes: current.length });
  } catch (error) {
    console.error("Failed to toggle incident like", error);
    return NextResponse.json({ error: "Pëlqimi nuk mund të ruhet." }, { status: 503 });
  }
}
