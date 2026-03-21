import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const building = await prisma.building.findFirst();
  const room = await prisma.room.findFirst();
  const resident = await prisma.user.findFirst({ where: { role: 'TENANT' } });
  const invoice = await prisma.invoice.findFirst();
  const ownerContract = await prisma.ownerContract.findFirst();

  console.log(`BUILDING_ID=${building?.id}`);
  console.log(`ROOM_ID=${room?.id}`);
  console.log(`RESIDENT_ID=${resident?.id}`);
  console.log(`INVOICE_ID=${invoice?.id}`);
  console.log(`OWNERCONTRACT_ID=${ownerContract?.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
