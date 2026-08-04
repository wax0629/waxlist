import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __waxlistPrisma?: PrismaClient;
  __waxlistPrismaVersion?: string;
};

/**
 * Bump when schema fields change so dev doesn't keep a stale PrismaClient
 * on globalThis after `prisma generate` (common HMR issue).
 */
const PRISMA_CLIENT_EPOCH = "comments-v1";

function createClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

function getClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return globalForPrisma.__waxlistPrisma ?? createClient();
  }

  // Dev: replace client if epoch changed (new schema after generate)
  if (
    globalForPrisma.__waxlistPrisma &&
    globalForPrisma.__waxlistPrismaVersion === PRISMA_CLIENT_EPOCH
  ) {
    return globalForPrisma.__waxlistPrisma;
  }

  if (globalForPrisma.__waxlistPrisma) {
    void globalForPrisma.__waxlistPrisma.$disconnect().catch(() => {});
  }
  const client = createClient();
  globalForPrisma.__waxlistPrisma = client;
  globalForPrisma.__waxlistPrismaVersion = PRISMA_CLIENT_EPOCH;
  return client;
}

export const prisma = getClient();

if (process.env.NODE_ENV === "production") {
  globalForPrisma.__waxlistPrisma = prisma;
}
