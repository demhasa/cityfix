import { pgTable, uuid, text, integer, real, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";

export const municipalities = pgTable("municipalities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  centerLat: real("center_lat").notNull(),
  centerLng: real("center_lng").notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  municipalityId: uuid("municipality_id").references(() => municipalities.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("citizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  municipalityId: uuid("municipality_id").references(() => municipalities.id).notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("new"),
  priority: text("priority").notNull().default("normal"),
  priorityScore: integer("priority_score").notNull().default(0),
  priorityBreakdown: jsonb("priority_breakdown"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  reportCount: integer("report_count").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [index("incidents_status_idx").on(table.status), index("incidents_municipality_idx").on(table.municipalityId)]);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentId: uuid("incident_id").references(() => incidents.id).notNull(),
  reporterId: uuid("reporter_id").references(() => users.id),
  photoUrl: text("photo_url"),
  imageHash: text("image_hash"),
  aiJson: jsonb("ai_json"),
  aiStatus: text("ai_status").notNull().default("pending"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const statusHistory = pgTable("status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentId: uuid("incident_id").references(() => incidents.id).notNull(),
  changedBy: uuid("changed_by").references(() => users.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  incidentId: uuid("incident_id").references(() => incidents.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sensitivePlaces = pgTable("sensitive_places", {
  id: uuid("id").defaultRandom().primaryKey(),
  municipalityId: uuid("municipality_id").references(() => municipalities.id).notNull(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  radiusMeters: integer("radius_meters").default(100).notNull(),
});
