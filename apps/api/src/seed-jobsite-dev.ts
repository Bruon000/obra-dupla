import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

async function main() {
  const jobSite = await prisma.jobSite.create({
    data: {
      companyId: "b47892d0-4da2-4c13-b2b3-dac2ec5801a3",
      title: "Obra de teste",
      address: "",
      notes: "",
      status: "EM_ANDAMENTO",
    },
  });

  console.log("JOBSITE_ID=", jobSite.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
