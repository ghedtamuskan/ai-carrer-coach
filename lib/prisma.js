
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

function normalizePostgresUrlForPg(url) {
  if (!url) return url;

  // pg-connection-string warns that sslmode=prefer|require|verify-ca are deprecated aliases.
  // Normalize to the recommended explicit mode to preserve current (strict) behavior.
  return url.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=(&|$))/,
    "$1sslmode=verify-full",
  );
}

const databaseUrl = normalizePostgresUrlForPg(process.env.DATABASE_URL);

// In dev, it's common to boot the app before env vars are set. Avoid crashing the
// entire RSC render; callers should handle `db === null`.
export const db = (() => {
  if (!databaseUrl) return null;

  const pool =
    globalForPrisma.pgPool ||
    new Pool({
      connectionString: databaseUrl,
    });

  const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter: new PrismaPg(pool),
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.pgPool = pool;
  }

  return prisma;
})();


