import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp"
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const safeName = path.basename(file);
  if (safeName !== file) return new NextResponse("Not found", { status: 404 });

  const extension = path.extname(safeName).toLowerCase();
  const type = contentTypes[extension];
  if (!type) return new NextResponse("Not found", { status: 404 });

  const uploadDir = process.env.MLP_UPLOAD_DIR || path.join("public", "uploads");
  try {
    const bytes = await readFile(path.join(uploadDir, safeName));
    return new NextResponse(bytes, {
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
