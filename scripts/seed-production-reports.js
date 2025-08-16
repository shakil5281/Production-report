const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedProductionReports() {
  try {
    console.log('🌱 Seeding production reports and balances...');

    // Create sample production list items first (if they don't exist)
    const sampleProductions = [
      {
        programCode: 'PRG-001',
        styleNo: 'ST-001',
        buyer: 'Buyer A',
        quantity: 1000,
        item: 'T-Shirt',
        price: 15.50,
        percentage: 0,
        status: 'RUNNING'
      },
      {
        programCode: 'PRG-002', 
        styleNo: 'ST-002',
        buyer: 'Buyer B',
        quantity: 800,
        item: 'Polo Shirt',
        price: 22.75,
        percentage: 0,
        status: 'RUNNING'
      }
    ];

    for (const prod of sampleProductions) {
      await prisma.productionList.upsert({
        where: { styleNo: prod.styleNo },
        update: {},
        create: prod
      });
    }

    // Create sample daily production reports
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Today's reports (as per your request: target 300, production 250)
    const todayReport1 = await prisma.dailyProductionReport.create({
      data: {
        date: today,
        styleNo: 'ST-001',
        targetQty: 300,
        productionQty: 200, // First 200 production
        unitPrice: 15.50,
        totalAmount: 200 * 15.50 * 120, // 372,000
        balanceQty: 100, // 300 - 200 = 100 remaining
        lineNo: 'LINE-01',
        notes: 'Initial production batch'
      }
    });

    const todayReport2 = await prisma.dailyProductionReport.create({
      data: {
        date: today,
        styleNo: 'ST-002',
        targetQty: 250,
        productionQty: 50, // Additional 50 production
        unitPrice: 22.75,
        totalAmount: 50 * 22.75 * 120, // 136,500
        balanceQty: 200, // 250 - 50 = 200 remaining
        lineNo: 'LINE-02',
        notes: 'Secondary production'
      }
    });

    // Create/update production balances
    await prisma.productionBalance.upsert({
      where: { styleNo: 'ST-001' },
      update: {
        totalTarget: 300,
        totalProduced: 200,
        currentBalance: 100, // Positive balance (need to produce 100 more)
        lastUpdated: new Date()
      },
      create: {
        styleNo: 'ST-001',
        totalTarget: 300,
        totalProduced: 200,
        currentBalance: 100
      }
    });

    await prisma.productionBalance.upsert({
      where: { styleNo: 'ST-002' },
      update: {
        totalTarget: 250,
        totalProduced: 50,
        currentBalance: 200, // Positive balance (need to produce 200 more)
        lastUpdated: new Date()
      },
      create: {
        styleNo: 'ST-002',
        totalTarget: 250,
        totalProduced: 50,
        currentBalance: 200
      }
    });

    console.log('✅ Successfully created sample production reports:');
    console.log(`- Style ST-001: Target 300, Produced 200, Balance +100`);
    console.log(`- Total Amount ST-001: $${(200 * 15.50 * 120).toLocaleString()}`);
    console.log(`- Style ST-002: Target 250, Produced 50, Balance +200`);
    console.log(`- Total Amount ST-002: $${(50 * 22.75 * 120).toLocaleString()}`);
    console.log('\n📊 Next day scenario:');
    console.log('- If ST-001 produces 400 tomorrow, balance will be: 300 + new_target - (200 + 400)');
    console.log('- If ST-002 produces 300 tomorrow, balance will be: 250 + new_target - (50 + 300)');

  } catch (error) {
    console.error('❌ Error seeding production reports:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedProductionReports()
    .then(() => {
      console.log('\n🎉 Production reports seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProductionReports };
