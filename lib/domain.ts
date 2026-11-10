import { z } from "zod";

export const categories = ["pothole", "street_light", "garbage", "traffic_sign", "sidewalk", "sewage", "public_space_damage", "illegal_parking", "other"] as const;
export const aiResultSchema = z.object({
  category: z.enum(categories),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(600),
  danger_level: z.number().int().min(1).max(5),
  danger_reason: z.string().min(2).max(200),
  suggested_priority: z.enum(["urgent", "high", "normal", "low"]),
  confidence: z.number().min(0).max(1),
  is_valid_municipal_issue: z.boolean(),
  subcategory: z.string().optional(),
  visual_observations: z.array(z.string()).optional(),
  severity: z.number().int().min(1).max(5).optional(),
  image_quality: z.string().optional(),
  description_matches_image: z.boolean().nullable().optional(),
  discrepancies: z.array(z.string()).optional(),
  public_safety_risk: z.string().optional(),
  recommended_action: z.string().optional(),
  department: z.string().optional(),
  requires_human_review: z.boolean().optional(),
  model_name: z.string().optional(),
});
export type AiResult = z.infer<typeof aiResultSchema>;

export const reportInputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(600),
  category: z.enum(categories),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  imageUrl: z.string().url().optional(),
});

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6371000;
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function isDuplicateReport(input: { lat: number; lng: number; category: string; createdAt: Date }, existing: { lat: number; lng: number; category: string; createdAt: Date }) {
  const withinTime = Math.abs(input.createdAt.getTime() - existing.createdAt.getTime()) <= 30 * 24 * 60 * 60 * 1000;
  return input.category === existing.category && withinTime && haversineMeters(input, existing) <= 30;
}

export function calculatePriority(input: { dangerLevel: number; reportCount: number; daysUnresolved: number; nearSensitivePlace: boolean; manualBoost?: number }) {
  const danger = Math.min(35, input.dangerLevel * 7);
  const reports = Math.min(25, input.reportCount * 2);
  const age = Math.min(20, input.daysUnresolved * 2);
  const sensitive = input.nearSensitivePlace ? 15 : 0;
  const manual = Math.max(0, Math.min(5, input.manualBoost ?? 0));
  const score = Math.min(100, danger + reports + age + sensitive + manual);
  return { score, breakdown: { danger, reports, age, sensitive, manual } };
}
