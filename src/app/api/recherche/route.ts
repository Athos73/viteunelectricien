import { NextResponse } from "next/server";
import { rechercheCommunes } from "@/lib/db";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  return NextResponse.json(rechercheCommunes(q, 8), {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
