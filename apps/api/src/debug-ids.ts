import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    select: { id: true, name: true, email: true, companyId: true },
  });

  const companies = await prisma.company.findMany({
    take: 10,
    select: { id: true, name: true },
  });

  console.log("USERS");
  console.dir(users, { depth: null });

  console.log("COMPANIES");
  console.dir(companies, { depth: null });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
