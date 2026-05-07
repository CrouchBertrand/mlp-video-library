import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"]
]);

export async function saveUploadedImage(file: File | null, prefix: string) {
  if (!file || file.size === 0) return null;
  const extension = allowedImageTypes.get(file.type);
  if (!extension) throw new Error("Please upload a JPG, PNG, GIF, or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Please upload an image smaller than 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const safePrefix = prefix.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "image";
  const safeName = `${safePrefix}-${Date.now()}${extension}`;
  const uploadDir = process.env.MLP_UPLOAD_DIR || path.join("public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), bytes);
  return `/uploads/${safeName}`;
}
