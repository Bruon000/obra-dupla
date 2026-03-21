import "dotenv/config";
import * as crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

const SALT_LEN = 16;
const KEY_LEN = 64;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LEN).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const devPassword = process.env.DEV_USER_PASSWORD ?? "123456";
  const email = "dev@obradupla.local";

  const existing = await prisma.user.findUnique({ where: { email } });

  const company =
    existing?.companyId
      ? await prisma.company.findUnique({ where: { id: existing.companyId } })
      : null;

  const ensuredCompany =
    company ??
    (await prisma.company.create({
      data: {
        name: "Obra Dupla Dev",
        billingStatus: "internal",
        planSlug: "legacy",
        maxJobSites: 999,
        maxUsers: 999,
      },
    }));

  await prisma.company.update({
    where: { id: ensuredCompany.id },
    data: {
      billingStatus: "internal",
      planSlug: "legacy",
      maxJobSites: 999,
      maxUsers: 999,
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hashPassword(devPassword),
      name: "Dev User",
      role: "ADMIN",
      companyId: ensuredCompany.id,
    },
    update: {
      passwordHash: hashPassword(devPassword),
      name: "Dev User",
      role: "ADMIN",
      companyId: ensuredCompany.id,
    },
  });

  console.log("COMPANY_ID=", ensuredCompany.id);
  console.log("USER_ID=", user.id);
  console.log("Login: dev@obradupla.local /", devPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
