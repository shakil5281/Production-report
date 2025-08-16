#!/usr/bin/env node

/**
 * Seed basic production system data for testing
 * This will create the minimum data needed to test the production balance system
 */

const { PrismaClient } = require('@prisma/client');
const { format } = require('date-fns');

async function seedProductionSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Seeding production system data...');
    
    // Step 1: Create factories
    console.log('\n🏭 Creating factories...');
    const factories = await Promise.all([
      prisma.factory.create({
        data: {
          name: 'Main Factory A',
          isActive: true
        }
      }),
      prisma.factory.create({
        data: {
          name: 'Factory B - Cutting',
          isActive: true
        }
      })
    ]);
    console.log(`   ✅ Created ${factories.length} factories`);
    
    // Step 2: Create production lines
    console.log('\n🔧 Creating production lines...');
    const lines = await Promise.all([
      prisma.line.create({
        data: {
          name: 'Sewing Line 1',
          code: 'LINE-001',
          isActive: true
        }
      }),
      prisma.line.create({
        data: {
          name: 'Sewing Line 2', 
          code: 'LINE-002',
          isActive: true
        }
      }),
      prisma.line.create({
        data: {
          name: 'Finishing Line 1',
          code: 'LINE-003',
          isActive: true
        }
      })
    ]);
    console.log(`   ✅ Created ${lines.length} production lines`);
    
    // Step 3: Create styles
    console.log('\n👕 Creating styles...');
    const styles = await Promise.all([
      prisma.style.create({
        data: {
          styleNumber: 'ST-001',
          buyer: 'Nike',
          poNumber: 'PO-2025-001',
          orderQty: 1000,
          unitPrice: 15.50,
          plannedStart: new Date('2025-01-15'),
          plannedEnd: new Date('2025-02-15'),
          status: 'RUNNING'
        }
      }),
      prisma.style.create({
        data: {
          styleNumber: 'ST-002',
          buyer: 'Adidas',
          poNumber: 'PO-2025-002', 
          orderQty: 800,
          unitPrice: 18.75,
          plannedStart: new Date('2025-01-16'),
          plannedEnd: new Date('2025-02-20'),
          status: 'RUNNING'
        }
      }),
      prisma.style.create({
        data: {
          styleNumber: 'ST-003',
          buyer: 'Puma',
          poNumber: 'PO-2025-003',
          orderQty: 1200,
          unitPrice: 12.25,
          plannedStart: new Date('2025-01-18'),
          plannedEnd: new Date('2025-02-25'),
          status: 'PENDING'
        }
      })
    ]);
    console.log(`   ✅ Created ${styles.length} styles`);
    
    // Step 4: Create production list entries
    console.log('\n📋 Creating production list entries...');
    const productionList = await Promise.all([
      prisma.productionList.create({
        data: {
          programCode: 'PROG-001',
          styleNo: 'ST-001',
          buyer: 'Nike',
          quantity: 1000,
          item: 'T-Shirt Basic Cotton',
          price: 15.50,
          percentage: 0,
          status: 'RUNNING'
        }
      }),
      prisma.productionList.create({
        data: {
          programCode: 'PROG-002',
          styleNo: 'ST-002',
          buyer: 'Adidas',
          quantity: 800,
          item: 'Polo Shirt Premium',
          price: 18.75,
          percentage: 0,
          status: 'RUNNING'
        }
      }),
      prisma.productionList.create({
        data: {
          programCode: 'PROG-003',
          styleNo: 'ST-003',
          buyer: 'Puma',
          quantity: 1200,
          item: 'Tank Top Performance',
          price: 12.25,
          percentage: 0,
          status: 'PENDING'
        }
      })
    ]);
    console.log(`   ✅ Created ${productionList.length} production list entries`);
    
    // Step 5: Create expense categories
    console.log('\n💰 Creating expense categories...');
    const expenseCategories = await Promise.all([
      prisma.expenseCategory.create({
        data: {
          name: 'Labor Cost',
          isSalaryFlag: true,
          isActive: true
        }
      }),
      prisma.expenseCategory.create({
        data: {
          name: 'Materials',
          isSalaryFlag: false,
          isActive: true
        }
      }),
      prisma.expenseCategory.create({
        data: {
          name: 'Utilities',
          isSalaryFlag: false,
          isActive: true
        }
      })
    ]);
    console.log(`   ✅ Created ${expenseCategories.length} expense categories`);
    
    // Step 6: Show summary
    console.log('\n📊 Data seeding completed successfully!');
    console.log('═'.repeat(50));
    console.log('🏭 Factories:', factories.length);
    console.log('🔧 Production Lines:', lines.length);
    console.log('👕 Styles:', styles.length);
    console.log('📋 Production List:', productionList.length);
    console.log('💰 Expense Categories:', expenseCategories.length);
    console.log('═'.repeat(50));
    
    console.log('\n📋 Available Lines for Testing:');
    lines.forEach(line => {
      console.log(`   - ${line.code}: ${line.name}`);
    });
    
    console.log('\n👕 Available Styles for Testing:');
    styles.forEach(style => {
      console.log(`   - ${style.styleNumber}: ${style.buyer} (${style.orderQty} pcs)`);
    });
    
    console.log('\n🎯 Ready for Production Balance Testing!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the development server: yarn dev');
    console.log('   2. Login to the system');
    console.log('   3. Create targets for any line + style combination');
    console.log('   4. Add hourly production data');
    console.log('   5. View results in production balance page');
    
    console.log('\n📚 Example API calls:');
    console.log('   Create Target:');
    console.log('   POST /api/target');
    console.log('   {');
    console.log('     "lineNo": "LINE-001",');
    console.log('     "styleNo": "ST-001",');
    console.log('     "lineTarget": 100,');
    console.log(`     "date": "${format(new Date(), 'yyyy-MM-dd')}",`);
    console.log('     "inTime": "08:00",');
    console.log('     "outTime": "17:00"');
    console.log('   }');
    
  } catch (error) {
    console.error('❌ Error seeding production system:', error);
    console.error('\n🛠️  Troubleshooting:');
    console.error('   1. Check database connection');
    console.error('   2. Ensure migrations are up to date');
    console.error('   3. Verify Prisma client is generated');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedProductionSystem().catch(console.error);
}

module.exports = { seedProductionSystem };
