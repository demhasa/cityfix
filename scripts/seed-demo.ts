import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required.");
const sql = neon(url);

async function seed() {
const municipality = await sql`
  INSERT INTO municipalities (name, slug, center_lat, center_lng)
  VALUES ('Komuna e Prishtinës', 'prishtina', 42.6629, 21.1655)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
`;
const municipalityId = municipality[0].id;

const demoPassword = await bcrypt.hash("CityFix123!", 10);
for (const profile of [
  ["1000000001", "demo@cityfix.test", null, "Agim", "Demhasaj", "Dardani", "citizen"],
  ["1000000002", "admin@cityfix.test", null, "Admin", "CityFix", "Qendër", "admin"],
] as const) {
  await sql`
    INSERT INTO users (municipality_id, personal_number, email, phone, password_hash, name, surname, neighborhood, role)
    VALUES (${municipalityId}, ${profile[0]}, ${profile[1]}, ${profile[2]}, ${demoPassword}, ${profile[3]}, ${profile[4]}, ${profile[5]}, ${profile[6]})
    ON CONFLICT (personal_number) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash
  `;
}

const demoIncidents = [
  ["Gropë e madhe në rrugë", "Gropë", "Gropë e rrezikshme pranë kryqëzimit dhe trotuarit.", "pothole", "urgent", 42.6604, 21.1612, 14, 88],
  ["Ndriçimi publik nuk punon", "Ndriçim publik", "Shtylla e ndriçimit nuk ndizet prej disa netësh.", "street_light", "high", 42.6578, 21.1694, 6, 67],
  ["Mbeturina pranë parkut", "Mbeturina", "Ka qese dhe mbeturina të shpërndara pranë hapësirës publike.", "garbage", "normal", 42.6652, 21.1722, 9, 48],
  ["Semafor i dëmtuar", "Shenjë trafiku", "Semafori në kryqëzim është i dëmtuar dhe vështirëson kalimin.", "traffic_sign", "urgent", 42.6631, 21.1584, 11, 82],
  ["Trotuar i dëmtuar", "Trotuar", "Pllakat e trotuarit janë të thyera dhe krijojnë pengesë.", "sidewalk", "normal", 42.6701, 21.1643, 4, 41],
  ["Parkim i palejuar në hyrje", "Parkim ilegal", "Automjete të parkuara bllokojnë hyrjen e këmbësorëve.", "illegal_parking", "high", 42.6591, 21.1748, 7, 61],
];

for (const [title, categoryLabel, description, category, priority, lat, lng, reportCount, priorityScore] of demoIncidents) {
  await sql`
    INSERT INTO incidents (
      municipality_id, category, title, description, status, priority,
      priority_score, priority_breakdown, lat, lng, report_count
    ) VALUES (
      ${municipalityId}, ${category}, ${title}, ${description},
      ${category === "street_light" ? "in_progress" : "new"}, ${priority},
      ${priorityScore}, ${JSON.stringify({ demo: true, source: "seed", categoryLabel })}::jsonb,
      ${lat}, ${lng}, ${reportCount}
    )
    ON CONFLICT DO NOTHING
  `;
}

console.log(`Seeded ${demoIncidents.length} demo incidents into Neon.`);
}

void seed();
