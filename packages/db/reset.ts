import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const h1 = await bcrypt.hash('Admin1234!', 12);
  const h2 = await bcrypt.hash('Coach1234!', 12);
  await prisma.user.update({ where: { email: 'admin@ironcoach.com' }, data: { passwordHash: h1 } });
  console.log('admin updated');
  await prisma.user.update({ where: { email: 'coach.ahmed@ironcoach.com' }, data: { passwordHash: h2 } });
  console.log('coach updated');
  await prisma['']();
}
main();
