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
  const company = await prisma.company.create({
    data: {
      name: "Obra Dupla Dev",
    },
  });

  const devPassword = process.env.DEV_USER_PASSWORD ?? "123456";
  const user = await prisma.user.create({
    data: {
      email: "dev@obradupla.local",
      passwordHash: hashPassword(devPassword),
      name: "Dev User",
      role: "ADMIN",
      companyId: company.id,
    },
  });

  console.log("COMPANY_ID=", company.id);
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
