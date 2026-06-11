import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const directUrl = process.env.DIRECT_URL?.trim();
  const isPostgresUrl = (value?: string) => value?.startsWith("postgresql://") || value?.startsWith("postgres://");

  if (databaseUrl && databaseUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }

  if (!isPostgresUrl(process.env.DATABASE_URL) && isPostgresUrl(directUrl)) {
    process.env.DATABASE_URL = directUrl;
  }
}

normalizeDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
