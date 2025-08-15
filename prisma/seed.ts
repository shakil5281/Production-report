import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create expense categories
  console.log('Creating expense categories...');
  const expenseCategories = [
    { name: 'SALARY', isSalaryFlag: true },
    { name: 'CASH_EXPENSE', isSalaryFlag: false },
    { name: 'UTILITIES', isSalaryFlag: false },
    { name: 'MAINTENANCE', isSalaryFlag: false },
    { name: 'RAW_MATERIALS', isSalaryFlag: false },
    { name: 'PACKAGING', isSalaryFlag: false },
    { name: 'TRANSPORTATION', isSalaryFlag: false },
    { name: 'OTHER', isSalaryFlag: false }
  ];

  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  // Create factories
  console.log('Creating factories...');
  let factory1 = await prisma.factory.findFirst({ where: { name: 'Main Factory' } });
  if (!factory1) {
    factory1 = await prisma.factory.create({ data: { name: 'Main Factory' } });
  }

  let factory2 = await prisma.factory.findFirst({ where: { name: 'Secondary Factory' } });
  if (!factory2) {
    factory2 = await prisma.factory.create({ data: { name: 'Secondary Factory' } });
  }

  // Create production lines
  console.log('Creating production lines...');
  const lines = [
    { name: 'Line A', code: 'A' },
    { name: 'Line B', code: 'B' },
    { name: 'Line C', code: 'C' },
    { name: 'Line X', code: 'X' },
    { name: 'Line Y', code: 'Y' },
    { name: 'Line Z', code: 'Z' }
  ];

  for (const line of lines) {
    const existingLine = await prisma.line.findUnique({ where: { code: line.code } });
    if (!existingLine) {
      await prisma.line.create({ data: line });
    }
  }

  // Create sample styles
  console.log('Creating sample styles...');
  const styles = [
    {
      styleNumber: 'ST001',
      buyer: 'Fashion Retailer A',
      poNumber: 'PO-2024-001',
      orderQty: 1000,
      unitPrice: 25.50,
      plannedStart: new Date('2024-01-01'),
      plannedEnd: new Date('2024-01-31')
    },
    {
      styleNumber: 'ST002',
      buyer: 'Fashion Retailer B',
      poNumber: 'PO-2024-002',
      orderQty: 800,
      unitPrice: 30.00,
      plannedStart: new Date('2024-01-15'),
      plannedEnd: new Date('2024-02-15')
    },
    {
      styleNumber: 'ST003',
      buyer: 'Fashion Retailer C',
      poNumber: 'PO-2024-003',
      orderQty: 1200,
      unitPrice: 22.75,
      plannedStart: new Date('2024-02-01'),
      plannedEnd: new Date('2024-02-28')
    }
  ];

  for (const style of styles) {
    const existingStyle = await prisma.style.findUnique({ where: { styleNumber: style.styleNumber } });
    if (!existingStyle) {
      await prisma.style.create({ data: style });
    }
  }

  // Create sample style assignments
  console.log('Creating style assignments...');
  const allLines = await prisma.line.findMany();
  const allStyles = await prisma.style.findMany();

  if (allLines.length > 0 && allStyles.length > 0) {
    // Assign first style to first line
    const existingAssignment = await prisma.styleAssignment.findFirst({
      where: {
        lineId: allLines[0].id,
        styleId: allStyles[0].id
      }
    });
    if (!existingAssignment) {
      await prisma.styleAssignment.create({
        data: {
          lineId: allLines[0].id,
          styleId: allStyles[0].id,
          startDate: new Date('2024-01-01'),
          targetPerHour: 50
        }
      });
    }

    // Assign second style to second line
    if (allLines.length > 1 && allStyles.length > 1) {
      const existingAssignment2 = await prisma.styleAssignment.findFirst({
        where: {
          lineId: allLines[1].id,
          styleId: allStyles[1].id
        }
      });
      if (!existingAssignment2) {
        await prisma.styleAssignment.create({
          data: {
            lineId: allLines[1].id,
            styleId: allStyles[1].id,
            startDate: new Date('2024-01-15'),
            targetPerHour: 45
          }
        });
      }
    }
  }

  // Create sample production entries for today
  console.log('Creating sample production entries...');
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  if (allLines.length > 0 && allStyles.length > 0) {
    // Create sample production entries for the first line and style
    const stages = ['CUTTING', 'SEWING', 'FINISHING'];
    
    for (let hour = 8; hour < 18; hour++) { // 8 AM to 6 PM
      for (const stage of stages) {
        const existingEntry = await prisma.productionEntry.findFirst({
          where: {
            date: new Date(todayString),
            hourIndex: hour,
            lineId: allLines[0].id,
            styleId: allStyles[0].id,
            stage: stage as any
          }
        });
        if (!existingEntry) {
          await prisma.productionEntry.create({
            data: {
              date: new Date(todayString),
              hourIndex: hour,
              lineId: allLines[0].id,
              styleId: allStyles[0].id,
              stage: stage as any,
              inputQty: Math.floor(Math.random() * 20) + 30,
              outputQty: Math.floor(Math.random() * 15) + 25,
              defectQty: Math.floor(Math.random() * 3),
              reworkQty: Math.floor(Math.random() * 2)
            }
          });
        }
      }
    }
  }

  // Create sample expenses
  console.log('Creating sample expenses...');
  const salaryCategory = await prisma.expenseCategory.findUnique({
    where: { name: 'SALARY' }
  });

  if (salaryCategory && allLines.length > 0) {
    await prisma.expense.create({
      data: {
        date: new Date(todayString),
        lineId: allLines[0].id,
        categoryId: salaryCategory.id,
        amount: 5000.00,
        description: 'Daily salary for Line A workers',
        paymentMethod: 'BANK'
      }
    });
  }

  // Create sample cashbook entries
  console.log('Creating sample cashbook entries...');
  await prisma.cashbookEntry.create({
    data: {
      date: new Date(todayString),
      type: 'DEBIT',
      amount: 5000.00,
      category: 'SALARY',
      referenceType: 'EXPENSE',
      lineId: allLines.length > 0 ? allLines[0].id : null,
      description: 'Salary payment for Line A workers'
    }
  });

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
