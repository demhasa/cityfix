import { analyzeReport } from "@/app/api/reports/route";

export async function POST(request: Request) {
  return analyzeReport(request);
}
