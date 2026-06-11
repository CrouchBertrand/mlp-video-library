import { spawnSync } from "node:child_process";

function isPostgresUrl(value) {
  return value?.startsWith("postgresql://") || value?.startsWith("postgres://");
}

const databaseUrl = process.env.DATABASE_URL?.trim();
const directUrl = process.env.DIRECT_URL?.trim();

if (databaseUrl && databaseUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

if (process.env.NETLIFY === "true" && isPostgresUrl(directUrl)) {
  process.env.DATABASE_URL = directUrl;
  console.log("Netlify build: using DIRECT_URL for Prisma schema setup.");
} else if (!isPostgresUrl(process.env.DATABASE_URL) && isPostgresUrl(directUrl)) {
  process.env.DATABASE_URL = directUrl;
  console.log("Netlify build: DATABASE_URL was not usable, falling back to DIRECT_URL.");
}

const steps = [
  ["npx", ["prisma", "generate", "--schema=prisma/schema.postgres.prisma"]],
  ["npx", ["prisma", "db", "push", "--schema=prisma/schema.postgres.prisma"]],
  ["npx", ["tsx", "scripts/init-production-db.ts"]],
  ["npx", ["next", "build", "--webpack"]]
];

for (const [command, args] of steps) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    env: process.env,
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
