import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [languages, resources] = await Promise.all([
      prisma.language.count(),
      prisma.video.count()
    ]);
    return NextResponse.json({ ok: true, languages, resources });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
