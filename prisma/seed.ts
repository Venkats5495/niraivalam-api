import { PrismaClient, UserRole, TransactionTypeEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Create Default Admin User ───────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@system.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // ─── Create Transaction Types ────────────────────────
  const transactionTypes = [
    { name: TransactionTypeEnum.CASH_IN, description: 'Money received / contribution' },
    { name: TransactionTypeEnum.CASH_OUT, description: 'Money paid out / withdrawal' },
    { name: TransactionTypeEnum.SEAT_PAYMENT, description: 'Payment towards a seat' },
    { name: TransactionTypeEnum.EXPENSE, description: 'Expense deduction' },
  ];

  for (const tt of transactionTypes) {
    await prisma.transactionType.upsert({
      where: { name: tt.name },
      update: {},
      create: tt,
    });
  }
  console.log(`Transaction types seeded: ${transactionTypes.length}`);

  // ─── Create Default Categories ───────────────────────
  const categories = [
    { name: 'Monthly Contribution', description: 'Regular monthly member contribution' },
    { name: 'Seat Payment', description: 'Payment towards a contribution seat' },
    { name: 'Payout', description: 'Money paid out to a member' },
    { name: 'Administrative', description: 'Administrative expenses' },
    { name: 'Miscellaneous', description: 'Uncategorized transactions' },
    { name: 'Penalty', description: 'Late payment or rule violation penalties' },
    { name: 'Interest', description: 'Interest earned or charged' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`Categories seeded: ${categories.length}`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
