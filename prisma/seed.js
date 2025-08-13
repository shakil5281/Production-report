const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (JS)...');

  // Expense categories
  const expenseCategories = [
    { name: 'SALARY', isSalaryFlag: true },
    { name: 'CASH_EXPENSE', isSalaryFlag: false },
    { name: 'UTILITIES', isSalaryFlag: false },
    { name: 'MAINTENANCE', isSalaryFlag: false },
    { name: 'RAW_MATERIALS', isSalaryFlag: false },
    { name: 'PACKAGING', isSalaryFlag: false },
    { name: 'TRANSPORTATION', isSalaryFlag: false },
    { name: 'OTHER', isSalaryFlag: false },
  ];

  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // Factories
  let factory1 = await prisma.factory.findFirst({ where: { name: 'Main Factory' } });
  if (!factory1) {
    factory1 = await prisma.factory.create({ data: { name: 'Main Factory' } });
  }
  let factory2 = await prisma.factory.findFirst({ where: { name: 'Secondary Factory' } });
  if (!factory2) {
    factory2 = await prisma.factory.create({ data: { name: 'Secondary Factory' } });
  }

  // Lines
  const lines = [
    { factoryId: factory1.id, name: 'Line A', code: 'A' },
    { factoryId: factory1.id, name: 'Line B', code: 'B' },
    { factoryId: factory1.id, name: 'Line C', code: 'C' },
    { factoryId: factory2.id, name: 'Line X', code: 'X' },
    { factoryId: factory2.id, name: 'Line Y', code: 'Y' },
    { factoryId: factory2.id, name: 'Line Z', code: 'Z' },
  ];
  for (const line of lines) {
    const existing = await prisma.line.findUnique({ where: { code: line.code } });
    if (!existing) {
      await prisma.line.create({ data: line });
    }
  }

  // Styles
  const styles = [
    {
      styleNumber: 'ST001',
      buyer: 'Fashion Retailer A',
      poNumber: 'PO-2024-001',
      orderQty: 1000,
      unitPrice: 25.5,
      plannedStart: new Date('2024-01-01'),
      plannedEnd: new Date('2024-01-31'),
    },
    {
      styleNumber: 'ST002',
      buyer: 'Fashion Retailer B',
      poNumber: 'PO-2024-002',
      orderQty: 800,
      unitPrice: 30.0,
      plannedStart: new Date('2024-01-15'),
      plannedEnd: new Date('2024-02-15'),
    },
    {
      styleNumber: 'ST003',
      buyer: 'Fashion Retailer C',
      poNumber: 'PO-2024-003',
      orderQty: 1200,
      unitPrice: 22.75,
      plannedStart: new Date('2024-02-01'),
      plannedEnd: new Date('2024-02-28'),
    },
  ];
  for (const style of styles) {
    const existing = await prisma.style.findUnique({ where: { styleNumber: style.styleNumber } });
    if (!existing) {
      await prisma.style.create({ data: style });
    }
  }

  // Style assignments
  const allLines = await prisma.line.findMany();
  const allStyles = await prisma.style.findMany();
  if (allLines.length && allStyles.length) {
    const assign1 = await prisma.styleAssignment.findFirst({
      where: { lineId: allLines[0].id, styleId: allStyles[0].id },
    });
    if (!assign1) {
      await prisma.styleAssignment.create({
        data: { lineId: allLines[0].id, styleId: allStyles[0].id, startDate: new Date('2024-01-01'), targetPerHour: 50 },
      });
    }
    if (allLines[1] && allStyles[1]) {
      const assign2 = await prisma.styleAssignment.findFirst({
        where: { lineId: allLines[1].id, styleId: allStyles[1].id },
      });
      if (!assign2) {
        await prisma.styleAssignment.create({
          data: { lineId: allLines[1].id, styleId: allStyles[1].id, startDate: new Date('2024-01-15'), targetPerHour: 45 },
        });
      }
    }
  }

  // Production entries
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  if (allLines.length && allStyles.length) {
    const stages = ['CUTTING', 'SEWING', 'FINISHING'];
    for (let hour = 8; hour < 18; hour++) {
      for (const stage of stages) {
        const existing = await prisma.productionEntry.findFirst({
          where: { date: new Date(todayString), hourIndex: hour, lineId: allLines[0].id, styleId: allStyles[0].id, stage },
        });
        if (!existing) {
          await prisma.productionEntry.create({
            data: {
              date: new Date(todayString),
              hourIndex: hour,
              lineId: allLines[0].id,
              styleId: allStyles[0].id,
              stage,
              inputQty: Math.floor(Math.random() * 20) + 30,
              outputQty: Math.floor(Math.random() * 15) + 25,
              defectQty: Math.floor(Math.random() * 3),
              reworkQty: Math.floor(Math.random() * 2),
            },
          });
        }
      }
    }
  }

  // Expenses
  const salaryCategory = await prisma.expenseCategory.findUnique({ where: { name: 'SALARY' } });
  if (salaryCategory && allLines.length) {
    await prisma.expense.create({
      data: {
        date: new Date(todayString),
        lineId: allLines[0].id,
        categoryId: salaryCategory.id,
        amount: 5000.0,
        description: 'Daily salary for Line A workers',
        paymentMethod: 'BANK',
      },
    });
  }

  // Cashbook entry
  await prisma.cashbookEntry.create({
    data: {
      date: new Date(todayString),
      type: 'DEBIT',
      amount: 5000.0,
      category: 'SALARY',
      referenceType: 'EXPENSE',
      lineId: allLines.length ? allLines[0].id : null,
      description: 'Salary payment for Line A workers',
    },
  });

  console.log('✅ Seeding (JS) completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });