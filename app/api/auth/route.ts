import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { municipalities, users } from "@/db/schema";

const credentialsSchema = z.object({
  personalNumber: z.string().trim().min(5).max(40),
  password: z.string().min(6).max(100),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80),
  surname: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const action = request.headers.get("x-auth-action") ?? "login";
  try {
    const db = getDb();
    if (action === "register") {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Të dhënat nuk janë valide." }, { status: 400 });
      const data = parsed.data;
      if (!data.email && !data.phone) return NextResponse.json({ error: "Shëno email ose numër telefoni." }, { status: 400 });
      const municipality = await db.select({ id: municipalities.id }).from(municipalities).where(eq(municipalities.slug, "prishtina")).limit(1);
      if (!municipality[0]) return NextResponse.json({ error: "Komuna nuk është konfiguruar." }, { status: 503 });
      const [user] = await db.insert(users).values({
        municipalityId: municipality[0].id,
        personalNumber: data.personalNumber,
        email: data.email || null,
        phone: data.phone || null,
        passwordHash: await bcrypt.hash(data.password, 10),
        name: data.name,
        surname: data.surname,
        neighborhood: data.neighborhood,
      }).returning({ id: users.id, name: users.name, surname: users.surname, role: users.role });
      const response = NextResponse.json({ user }, { status: 201 });
      response.cookies.set("cityfix_user", user.id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
      return response;
    }

    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Të dhënat nuk janë valide." }, { status: 400 });
    const data = parsed.data;
    const [user] = await db.select({
      id: users.id, name: users.name, surname: users.surname, role: users.role, passwordHash: users.passwordHash,
    }).from(users).where(or(eq(users.personalNumber, data.personalNumber), eq(users.email, data.personalNumber))).limit(1);
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Numri personal ose fjalëkalimi është gabim." }, { status: 401 });
    }

    const response = NextResponse.json({ user: { id: user.id, name: user.name, surname: user.surname, role: user.role } });
    response.cookies.set("cityfix_user", user.id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return response;
  } catch (error) {
    console.error("Authentication failed", error);
    return NextResponse.json({ error: "Veprimi nuk mund të përfundojë tani." }, { status: 503 });
  }
}

export async function GET() {
    const userId = (await cookies()).get("cityfix_user")?.value;
    if (!userId) return NextResponse.json({ user: null });
    try {
      const [user] = await getDb().select({ id: users.id, name: users.name, surname: users.surname, role: users.role })
        .from(users).where(eq(users.id, userId)).limit(1);
      return NextResponse.json({ user: user ?? null });
    } catch (error) {
      console.error("Failed to restore session", error);
      return NextResponse.json({ error: "Sesioni nuk mund të rikthehet." }, { status: 503 });
  }
}
