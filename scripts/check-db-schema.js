#!/usr/bin/env node

/**
 * Script to check database schema and production balance table
 */

const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database schema...');
    
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if production_balances table exists
    console.log('2. Checking production_balances table...');
    const tables = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'production_balances'
      ORDER BY ordinal_position
    `;
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✅ production_balances table exists with columns:');
      tables.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('❌ production_balances table does not exist');
      console.log('💡 You may need to run the migration:');
      console.log('   yarn prisma migrate deploy');
      return;
    }
    
    // Check production_list table
    console.log('3. Checking production_list table...');
    const productionListTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'production_list'
    `;
    
    if (Array.isArray(productionListTables) && productionListTables.length > 0) {
      console.log('✅ production_list table exists');
    } else {
      console.log('❌ production_list table does not exist');
    }
    
    // Try to count records
    console.log('4. Checking record counts...');
    try {
      const balanceCount = await prisma.productionBalance.count();
      console.log(`✅ ProductionBalance records: ${balanceCount}`);
      
      const productionListCount = await prisma.productionList.count();
      console.log(`✅ ProductionList records: ${productionListCount}`);
      
      const targetCount = await prisma.target.count();
      console.log(`✅ Target records: ${targetCount}`);
      
    } catch (countError) {
      console.error('❌ Error counting records:', countError.message);
    }
    
    // Check for sample data
    console.log('5. Checking for sample data...');
    try {
      const sampleBalances = await prisma.productionBalance.findMany({
        take: 3,
        include: {
          productionList: true
        }
      });
      
      if (sampleBalances.length > 0) {
        console.log('✅ Sample production balance data:');
        sampleBalances.forEach(balance => {
          console.log(`   - ${balance.styleNo} | ${balance.lineNo} | Target: ${balance.lineTarget} | Produced: ${balance.totalProduced}`);
        });
      } else {
        console.log('⚠️  No production balance data found');
        console.log('💡 You may need to sync data from targets:');
        console.log('   curl -X PUT http://localhost:3000/api/production/balances \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"date": "2025-01-16"}\'');
      }
    } catch (dataError) {
      console.error('❌ Error fetching sample data:', dataError.message);
    }
    
    console.log('\n🎉 Database schema check completed!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkDatabase().catch(console.error);
}

module.exports = { checkDatabase };
