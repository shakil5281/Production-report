const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('decimal.js');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting daily production report seeding...');

  try {
    // Get existing production list items
    const productionItems = await prisma.productionList.findMany();
    if (productionItems.length === 0) {
      console.log('No production list items found. Please run the production list seed first.');
      return;
    }

    // Get existing lines
    const lines = await prisma.line.findMany();
    if (lines.length === 0) {
      console.log('No production lines found. Please run the main seed first.');
      return;
    }

    // Create sample daily production reports for today and yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dates = [today, yesterday];

    for (const date of dates) {
      console.log(`Creating reports for ${date.toDateString()}...`);
      
      for (let i = 0; i < Math.min(productionItems.length, 3); i++) {
        const item = productionItems[i];
        const line = lines[i % lines.length];
        
        // Create daily production report
        await prisma.dailyProductionReport.upsert({
          where: {
            id: `sample-${date.toISOString().split('T')[0]}-${item.styleNo}-${line.code}`
          },
          update: {},
          create: {
            id: `sample-${date.toISOString().split('T')[0]}-${item.styleNo}-${line.code}`,
            date: date,
            styleNo: item.styleNo,
            targetQty: Math.floor(Math.random() * 500) + 100,
            productionQty: Math.floor(Math.random() * 400) + 50,
            unitPrice: item.price,
            totalAmount: new Decimal(0), // Will be calculated
            netAmount: new Decimal(0), // Will be calculated
            lineNo: line.code,
            notes: `Sample report for ${item.styleNo} on ${line.name}`
          }
        });
      }
    }

    console.log('✅ Daily production reports seeded successfully!');
    
    // Display what was created
    const totalReports = await prisma.dailyProductionReport.count();
    console.log(`Total daily production reports in database: ${totalReports}`);
    
  } catch (error) {
    console.error('❌ Error seeding daily production reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
