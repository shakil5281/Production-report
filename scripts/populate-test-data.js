#!/usr/bin/env node

/**
 * Script to populate test data directly in the database
 */

const { PrismaClient } = require('@prisma/client');

async function populateTestData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🏗️ Populating test data...');
    
    // Create production list entries if they don't exist
    console.log('1. Creating production list entries...');
    
    const productionEntries = [
      {
        programCode: 'PRG001',
        styleNo: 'ST001',
        buyer: 'Nike',
        quantity: 1000,
        item: 'T-Shirt Cotton Basic',
        price: 15.50,
        status: 'RUNNING'
      },
      {
        programCode: 'PRG002', 
        styleNo: 'ST002',
        buyer: 'Adidas',
        quantity: 800,
        item: 'Polo Shirt Premium',
        price: 22.00,
        status: 'RUNNING'
      },
      {
        programCode: 'PRG003',
        styleNo: 'ST003',
        buyer: 'Puma',
        quantity: 1200,
        item: 'Hoodie Fleece',
        price: 35.00,
        status: 'PENDING'
      }
    ];

    for (const entry of productionEntries) {
      try {
        await prisma.productionList.upsert({
          where: { styleNo: entry.styleNo },
          update: entry,
          create: entry
        });
        console.log(`✅ Created/updated production entry: ${entry.styleNo}`);
      } catch (error) {
        console.log(`⚠️ Failed to create production entry ${entry.styleNo}: ${error.message}`);
      }
    }

    // Create targets
    console.log('2. Creating targets...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const targets = [
      {
        lineNo: 'LINE-001',
        styleNo: 'ST001',
        lineTarget: 100,
        date: today,
        inTime: '08:00',
        outTime: '20:00',
        hourlyProduction: 85
      },
      {
        lineNo: 'LINE-002',
        styleNo: 'ST002', 
        lineTarget: 120,
        date: today,
        inTime: '08:00',
        outTime: '20:00',
        hourlyProduction: 135
      },
      {
        lineNo: 'LINE-003',
        styleNo: 'ST001',
        lineTarget: 80,
        date: today,
        inTime: '08:00', 
        outTime: '20:00',
        hourlyProduction: 75
      },
      {
        lineNo: 'LINE-001',
        styleNo: 'ST003',
        lineTarget: 90,
        date: yesterday,
        inTime: '08:00',
        outTime: '20:00', 
        hourlyProduction: 95
      }
    ];

    for (const target of targets) {
      try {
        const created = await prisma.target.create({
          data: target
        });
        console.log(`✅ Created target: ${target.styleNo} - ${target.lineNo} (${target.date.toDateString()})`);
      } catch (error) {
        console.log(`⚠️ Failed to create target ${target.styleNo} - ${target.lineNo}: ${error.message}`);
      }
    }

    // Create production balance entries
    console.log('3. Creating production balance entries...');
    
    const balances = [
      {
        styleNo: 'ST001',
        lineNo: 'LINE-001',
        date: today,
        lineTarget: 100,
        totalTarget: 180, // Combined target for ST001 (100 + 80)
        totalProduced: 85,
        hourlyProduction: {
          '8-9': 10,
          '9-10': 12,
          '10-11': 8,
          '11-12': 9,
          '12-1': 5,
          '1-2': 11,
          '2-3': 10,
          '3-4': 8,
          '4-5': 7,
          '5-6': 5
        },
        currentBalance: -15 // 85 - 100
      },
      {
        styleNo: 'ST002',
        lineNo: 'LINE-002', 
        date: today,
        lineTarget: 120,
        totalTarget: 120,
        totalProduced: 135,
        hourlyProduction: {
          '8-9': 15,
          '9-10': 18,
          '10-11': 12,
          '11-12': 14,
          '12-1': 6,
          '1-2': 16,
          '2-3': 15,
          '3-4': 12,
          '4-5': 13,
          '5-6': 14
        },
        currentBalance: 15 // 135 - 120
      },
      {
        styleNo: 'ST001',
        lineNo: 'LINE-003',
        date: today,
        lineTarget: 80,
        totalTarget: 180,
        totalProduced: 75,
        hourlyProduction: {
          '8-9': 8,
          '9-10': 9,
          '10-11': 7,
          '11-12': 8,
          '12-1': 4,
          '1-2': 9,
          '2-3': 8,
          '3-4': 7,
          '4-5': 8,
          '5-6': 7
        },
        currentBalance: -5 // 75 - 80
      },
      {
        styleNo: 'ST003',
        lineNo: 'LINE-001',
        date: yesterday,
        lineTarget: 90,
        totalTarget: 90,
        totalProduced: 95,
        hourlyProduction: {
          '8-9': 11,
          '9-10': 12,
          '10-11': 9,
          '11-12': 10,
          '12-1': 5,
          '1-2': 12,
          '2-3': 10,
          '3-4': 9,
          '4-5': 8,
          '5-6': 9
        },
        currentBalance: 5 // 95 - 90
      }
    ];

    for (const balance of balances) {
      try {
        await prisma.productionBalance.upsert({
          where: {
            styleNo_lineNo_date: {
              styleNo: balance.styleNo,
              lineNo: balance.lineNo,
              date: balance.date
            }
          },
          update: balance,
          create: balance
        });
        console.log(`✅ Created/updated balance: ${balance.styleNo} - ${balance.lineNo} (${balance.date.toDateString()})`);
      } catch (error) {
        console.log(`⚠️ Failed to create balance ${balance.styleNo} - ${balance.lineNo}: ${error.message}`);
      }
    }

    // Display summary
    console.log('\n📊 Data Summary:');
    const productionCount = await prisma.productionList.count();
    const targetCount = await prisma.target.count();
    const balanceCount = await prisma.productionBalance.count();
    
    console.log(`✅ Production List entries: ${productionCount}`);
    console.log(`✅ Target entries: ${targetCount}`);
    console.log(`✅ Production Balance entries: ${balanceCount}`);
    
    console.log('\n🎉 Test data population completed!');
    console.log('💡 You can now access the target management page at: http://localhost:3000/target');
    
  } catch (error) {
    console.error('❌ Error populating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  populateTestData().catch(console.error);
}

module.exports = { populateTestData };
