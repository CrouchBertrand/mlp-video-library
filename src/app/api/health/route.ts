import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeError(error: unknown) {
  const value = error as { name?: string; code?: string; message?: string };
  const message = value.message
    ?.replace(/postgresql:\/\/[^\s"'`]+/g, "[database-url-hidden]")
    .replace(/postgres:\/\/[^\s"'`]+/g, "[database-url-hidden]")
    .replace(/:[^:@/\s]+@/g, ":***@");

  return {
    name: value.name ?? "Error",
    code: value.code ?? null,
    message: message?.slice(0, 500) ?? "Unknown database error"
  };
}

export async function GET() {
  try {
    const [languages, resources] = await Promise.all([
      prisma.language.count(),
      prisma.video.count()
    ]);
    return NextResponse.json({ ok: true, languages, resources });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 500 });
  }
}
