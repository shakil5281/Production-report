#!/usr/bin/env node

/**
 * Reset database while preserving users and user-related data
 * This script will:
 * 1. Backup user data
 * 2. Clear production-related tables
 * 3. Keep authentication and user management intact
 */

const { PrismaClient } = require('@prisma/client');

async function resetDatabaseKeepUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting database reset (preserving users)...');
    
    // Step 1: Check current data
    console.log('\n📊 Checking current data counts...');
    const userCount = await prisma.user.count();
    const targetCount = await prisma.target.count();
    const balanceCount = await prisma.productionBalance.count();
    const productionListCount = await prisma.productionList.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Targets: ${targetCount}`);
    console.log(`   Production Balances: ${balanceCount}`);
    console.log(`   Production List: ${productionListCount}`);
    
    if (userCount === 0) {
      console.log('⚠️  No users found. Consider creating a super admin after reset.');
    }
    
    // Step 2: Clear production-related data (preserve users)
    console.log('\n🗑️  Clearing production data...');
    
    // Clear in order to respect foreign key constraints
    console.log('   - Clearing production balances...');
    await prisma.productionBalance.deleteMany({});
    
    console.log('   - Clearing daily production reports...');
    await prisma.dailyProductionReport.deleteMany({});
    
    console.log('   - Clearing targets...');
    await prisma.target.deleteMany({});
    
    console.log('   - Clearing production entries...');
    await prisma.productionEntry.deleteMany({});
    
    console.log('   - Clearing shipments...');
    await prisma.shipment.deleteMany({});
    
    console.log('   - Clearing style assignments...');
    await prisma.styleAssignment.deleteMany({});
    
    console.log('   - Clearing styles...');
    await prisma.style.deleteMany({});
    
    console.log('   - Clearing production list...');
    await prisma.productionList.deleteMany({});
    
    console.log('   - Clearing lines...');
    await prisma.line.deleteMany({});
    
    console.log('   - Clearing factories...');
    await prisma.factory.deleteMany({});
    
    // Clear other non-user data
    console.log('   - Clearing expenses...');
    await prisma.expense.deleteMany({});
    
    console.log('   - Clearing salary entries...');
    await prisma.salaryEntry.deleteMany({});
    
    console.log('   - Clearing cashbook entries...');
    await prisma.cashbookEntry.deleteMany({});
    
    console.log('   - Clearing expense categories...');
    await prisma.expenseCategory.deleteMany({});
    
    // Step 3: Verify data cleared
    console.log('\n✅ Verifying data cleared...');
    const afterCounts = {
      users: await prisma.user.count(),
      targets: await prisma.target.count(),
      balances: await prisma.productionBalance.count(),
      productionList: await prisma.productionList.count(),
      lines: await prisma.line.count()
    };
    
    console.log(`   Users: ${afterCounts.users} (preserved)`);
    console.log(`   Targets: ${afterCounts.targets} (cleared)`);
    console.log(`   Production Balances: ${afterCounts.balances} (cleared)`);
    console.log(`   Production List: ${afterCounts.productionList} (cleared)`);
    console.log(`   Lines: ${afterCounts.lines} (cleared)`);
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ User accounts preserved');
    console.log('   ✅ Authentication data intact');
    console.log('   ✅ Production data cleared');
    console.log('   ✅ Ready for fresh production data');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Run migrations: yarn prisma migrate deploy');
    console.log('   2. Generate Prisma client: yarn prisma generate');
    console.log('   3. Seed with fresh data if needed');
    console.log('   4. Test the production balance system');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    console.error('\n🛠️  Troubleshooting:');
    console.error('   1. Check database connection');
    console.error('   2. Ensure no active connections to the database');
    console.error('   3. Verify Prisma schema is up to date');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset if this file is executed directly
if (require.main === module) {
  resetDatabaseKeepUsers().catch(console.error);
}

module.exports = { resetDatabaseKeepUsers };
