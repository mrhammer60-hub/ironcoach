import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Coach1234!', 12);
  const updated = await prisma.user.updateMany({
    where: { NOT: { email: { in: ['admin@ironcoach.com', 'coach.ahmed@ironcoach.com'] } } },
    data: { passwordHash: hash }
  });
  console.log('Updated', updated.count, 'users');
  await prisma['\']();
}
main();
