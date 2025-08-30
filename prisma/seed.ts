import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create expense categories
  const expenseCategories = await Promise.all([
    prisma.expenseCategory.upsert({
      where: { name: 'Raw Materials' },
      update: {},
      create: { name: 'Raw Materials' }
    }),
    prisma.expenseCategory.upsert({
      where: { name: 'Labor' },
      update: {},
      create: { name: 'Labor' }
    }),
    prisma.expenseCategory.upsert({
      where: { name: 'Overhead' },
      update: {},
      create: { name: 'Overhead' }
    }),
    prisma.expenseCategory.upsert({
      where: { name: 'Utilities' },
      update: {},
      create: { name: 'Utilities' }
    }),
    prisma.expenseCategory.upsert({
      where: { name: 'Maintenance' },
      update: {},
      create: { name: 'Maintenance' }
    })
  ]);

  // Create factories
  const factories = await Promise.all([
    prisma.factory.create({
      data: { 
        name: 'Main Factory', 
        isActive: true
      }
    }),
    prisma.factory.create({
      data: { 
        name: 'Secondary Factory', 
        isActive: true
      }
    })
  ]);

  // Create production lines
  const lines = await Promise.all([
    prisma.line.upsert({
      where: { code: 'A' },
      update: {},
      create: { 
        code: 'A', 
        name: 'Line A', 
        isActive: true
      }
    }),
    prisma.line.upsert({
      where: { code: 'B' },
      update: {},
      create: { 
        code: 'B', 
        name: 'Line B', 
        isActive: true
      }
    }),
    prisma.line.upsert({
      where: { code: 'C' },
      update: {},
      create: { 
        code: 'C', 
        name: 'Line C', 
        isActive: true
      }
    })
  ]);

  // Create sample styles
  const styles = await Promise.all([
    prisma.style.upsert({
      where: { styleNumber: 'ST001' },
      update: {},
      create: { 
        styleNumber: 'ST001', 
        buyer: 'Fashion Brand A',
        poNumber: 'PO001',
        orderQty: 1000,
        unitPrice: 25.50,
        plannedStart: new Date('2025-01-01'),
        plannedEnd: new Date('2025-03-31')
      }
    }),
    prisma.style.upsert({
      where: { styleNumber: 'ST002' },
      update: {},
      create: { 
        styleNumber: 'ST002', 
        buyer: 'Fashion Brand B',
        poNumber: 'PO002',
        orderQty: 800,
        unitPrice: 35.00,
        plannedStart: new Date('2025-02-01'),
        plannedEnd: new Date('2025-04-30')
      }
    }),
    prisma.style.upsert({
      where: { styleNumber: 'ST003' },
      update: {},
      create: { 
        styleNumber: 'ST003', 
        buyer: 'Fashion Brand C',
        poNumber: 'PO003',
        orderQty: 600,
        unitPrice: 45.00,
        plannedStart: new Date('2025-03-01'),
        plannedEnd: new Date('2025-05-31')
      }
    })
  ]);

  // Create style assignments
  const styleAssignments = await Promise.all([
    prisma.styleAssignment.create({
      data: {
        lineId: lines[0].id,
        styleId: styles[0].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        targetPerHour: 50
      }
    }),
    prisma.styleAssignment.create({
      data: {
        lineId: lines[1].id,
        styleId: styles[1].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        targetPerHour: 60
      }
    })
  ]);

  // Create sample production entries
  const productionEntries = await Promise.all([
    prisma.productionEntry.create({
      data: {
        lineId: lines[0].id,
        styleId: styles[0].id,
        date: new Date('2025-08-14'),
        hourIndex: 8,
        stage: 'CUTTING',
        inputQty: 50,
        outputQty: 45,
        defectQty: 2,
        reworkQty: 1
      }
    }),
    prisma.productionEntry.create({
      data: {
        lineId: lines[0].id,
        styleId: styles[0].id,
        date: new Date('2025-08-14'),
        hourIndex: 9,
        stage: 'SEWING',
        inputQty: 50,
        outputQty: 48,
        defectQty: 1,
        reworkQty: 0
      }
    }),
    prisma.productionEntry.create({
      data: {
        lineId: lines[1].id,
        styleId: styles[1].id,
        date: new Date('2025-08-14'),
        hourIndex: 8,
        stage: 'FINISHING',
        inputQty: 60,
        outputQty: 55,
        defectQty: 3,
        reworkQty: 1
      }
    })
  ]);

  // Create sample expenses
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        date: new Date('2025-08-14'),
        categoryId: expenseCategories[0].id, // Raw Materials
        amount: 1500,
        description: 'Fabric purchase',
        paymentMethod: 'CASH'
      }
    }),
    prisma.expense.create({
      data: {
        date: new Date('2025-08-14'),
        categoryId: expenseCategories[1].id, // Labor
        amount: 800,
        description: 'Overtime pay',
        paymentMethod: 'BANK'
      }
    })
  ]);

  // Create sample cashbook entries
  const cashbookEntries = await Promise.all([
    prisma.cashbookEntry.create({
      data: {
        date: new Date('2025-08-14'),
        amount: 5000,
        type: 'CREDIT',
        category: 'Sales',
        description: 'Daily sales revenue'
      }
    }),
    prisma.cashbookEntry.create({
      data: {
        date: new Date('2025-08-14'),
        amount: 2300,
        type: 'DEBIT',
        category: 'Daily Expense',
        description: 'Daily operational expenses'
      }
    })
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
