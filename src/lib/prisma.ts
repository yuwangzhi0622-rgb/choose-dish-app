import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDatabaseUrl: string | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN || undefined,
  });

  return new PrismaClient({ adapter });
}

const prisma =
  globalForPrisma.prisma && globalForPrisma.prismaDatabaseUrl === DATABASE_URL
    ? globalForPrisma.prisma
    : createPrismaClient();

export { prisma };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDatabaseUrl = DATABASE_URL;
}
