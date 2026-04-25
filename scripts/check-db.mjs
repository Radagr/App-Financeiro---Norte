import { readFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
process.env.DATABASE_URL = env.DATABASE_URL;
const { PrismaPg } = await import("@prisma/adapter-pg");
const { PrismaClient } = await import("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
try {
  const count = await prisma.user.count();
  console.log("OK — prisma.user.count() =", count);
  console.log("M1 DB connection verified ✓");
} catch (e) {
  console.error("ERR:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
