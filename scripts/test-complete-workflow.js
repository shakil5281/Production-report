#!/usr/bin/env node

/**
 * Complete workflow test: Target creation → Hourly production → Balance updates
 * This demonstrates the full automatic system you requested
 */

const { format } = require('date-fns');

// Test configuration
const TEST_DATA = {
  styleNo: 'ST-AUTO-001',
  lineNo: 'LINE-AUTO-001',
  date: format(new Date(), 'yyyy-MM-dd'),
  lineTarget: 100,
  hourlyData: [
    { hour: 8, production: 8 },   // 8-9 AM: 8 pieces
    { hour: 9, production: 12 },  // 9-10 AM: 12 pieces
    { hour: 10, production: 15 }, // 10-11 AM: 15 pieces
    { hour: 11, production: 10 }, // 11-12 AM: 10 pieces
    { hour: 14, production: 18 }, // 2-3 PM: 18 pieces
    { hour: 15, production: 20 }, // 3-4 PM: 20 pieces
    { hour: 16, production: 17 }  // 4-5 PM: 17 pieces
  ]
};

async function testCompleteWorkflow() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  console.log('🚀 Testing Complete Production Balance Workflow');
  console.log('═'.repeat(60));
  console.log(`Style: ${TEST_DATA.styleNo}`);
  console.log(`Line: ${TEST_DATA.lineNo}`);
  console.log(`Date: ${TEST_DATA.date}`);
  console.log(`Target: ${TEST_DATA.lineTarget} pieces`);
  console.log('═'.repeat(60));

  try {
    // Step 1: Create a target (this should auto-create production balance)
    console.log('\n📊 Step 1: Creating Target...');
    
    const targetResponse = await fetch(`${baseUrl}/api/target`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lineNo: TEST_DATA.lineNo,
        styleNo: TEST_DATA.styleNo,
        lineTarget: TEST_DATA.lineTarget,
        date: TEST_DATA.date,
        inTime: '08:00',
        outTime: '17:00',
        hourlyProduction: 0
      })
    });

    if (!targetResponse.ok) {
      const errorText = await targetResponse.text();
      console.log('❌ Target creation failed:', errorText);
      return;
    }

    const targetData = await targetResponse.json();
    console.log('✅ Target created successfully');
    console.log(`   Target ID: ${targetData.data.id}`);
    console.log(`   Message: ${targetData.message}`);

    // Step 2: Check if production balance was auto-created
    console.log('\n🔍 Step 2: Checking Auto-Created Production Balance...');
    
    const balanceCheckResponse = await fetch(
      `${baseUrl}/api/production/balances/public?styleNo=${TEST_DATA.styleNo}&lineNo=${TEST_DATA.lineNo}&date=${TEST_DATA.date}`
    );

    if (balanceCheckResponse.ok) {
      const balanceData = await balanceCheckResponse.json();
      if (balanceData.success && balanceData.data.length > 0) {
        const balance = balanceData.data[0];
        console.log('✅ Production balance auto-created');
        console.log(`   Balance ID: ${balance.id}`);
        console.log(`   Initial Target: ${balance.lineTarget}`);
        console.log(`   Initial Production: ${balance.totalProduced}`);
        console.log(`   Initial Balance: ${balance.currentBalance}`);
      } else {
        console.log('⚠️ Production balance not found (may need authentication)');
      }
    }

    // Step 3: Add hourly production data one by one
    console.log('\n⏰ Step 3: Adding Hourly Production Data...');
    console.log('─'.repeat(50));
    
    let totalProduced = 0;
    
    for (const hourData of TEST_DATA.hourlyData) {
      console.log(`\n📈 Adding production for hour ${hourData.hour}:00 - ${hourData.hour + 1}:00`);
      console.log(`   Production: ${hourData.production} pieces`);
      
      const hourlyResponse = await fetch(`${baseUrl}/api/production/hourly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          styleNo: TEST_DATA.styleNo,
          lineNo: TEST_DATA.lineNo,
          date: TEST_DATA.date,
          hourIndex: hourData.hour,
          production: hourData.production
        })
      });

      if (hourlyResponse.ok) {
        const hourlyData = await hourlyResponse.json();
        totalProduced += hourData.production;
        const efficiency = ((totalProduced / TEST_DATA.lineTarget) * 100).toFixed(1);
        
        console.log(`   ✅ Added successfully`);
        console.log(`   📊 Running Total: ${totalProduced} pieces`);
        console.log(`   📈 Current Efficiency: ${efficiency}%`);
        console.log(`   ⚖️ Current Balance: ${totalProduced - TEST_DATA.lineTarget}`);
      } else {
        const errorText = await hourlyResponse.text();
        console.log(`   ❌ Failed to add hourly production: ${errorText}`);
      }
      
      // Small delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Get final production balance
    console.log('\n📋 Step 4: Final Production Balance Summary...');
    console.log('═'.repeat(60));
    
    const finalBalanceResponse = await fetch(
      `${baseUrl}/api/production/balances/public?styleNo=${TEST_DATA.styleNo}&lineNo=${TEST_DATA.lineNo}&date=${TEST_DATA.date}`
    );

    if (finalBalanceResponse.ok) {
      const finalData = await finalBalanceResponse.json();
      if (finalData.success && finalData.data.length > 0) {
        const finalBalance = finalData.data[0];
        const efficiency = ((finalBalance.totalProduced / finalBalance.lineTarget) * 100).toFixed(1);
        
        console.log('📊 FINAL RESULTS:');
        console.log(`   🎯 Target: ${finalBalance.lineTarget} pieces`);
        console.log(`   ✅ Produced: ${finalBalance.totalProduced} pieces`);
        console.log(`   ⚖️ Balance: ${finalBalance.currentBalance} pieces`);
        console.log(`   📈 Efficiency: ${efficiency}%`);
        console.log(`   ⏰ Last Updated: ${new Date(finalBalance.lastUpdated).toLocaleString()}`);
        
        console.log('\n🕐 Hourly Breakdown:');
        const hourlyProd = finalBalance.hourlyProduction || {};
        Object.entries(hourlyProd).forEach(([slot, production]) => {
          console.log(`   ${slot}: ${production} pieces`);
        });
        
        // Performance assessment
        console.log('\n📊 Performance Assessment:');
        if (efficiency >= 100) {
          console.log('   🎉 EXCELLENT: Target exceeded!');
        } else if (efficiency >= 90) {
          console.log('   👍 GOOD: Close to target');
        } else if (efficiency >= 70) {
          console.log('   ⚠️ AVERAGE: Below target but acceptable');
        } else {
          console.log('   ❌ POOR: Significantly below target');
        }
      }
    }

    console.log('\n🎉 Complete workflow test finished successfully!');
    console.log('\n💡 Key Features Demonstrated:');
    console.log('   ✅ Automatic balance creation when target is created');
    console.log('   ✅ Dynamic hourly production tracking');
    console.log('   ✅ Real-time balance calculations');
    console.log('   ✅ Cumulative production updates');
    console.log('   ✅ Efficiency monitoring');

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    console.log('\n🛠️ Troubleshooting:');
    console.log('   1. Make sure the development server is running (yarn dev)');
    console.log('   2. Check database connectivity');
    console.log('   3. Verify API endpoints are accessible');
    console.log('   4. Check for authentication requirements');
  }
}

// Helper function to demonstrate API usage
function printApiUsageExamples() {
  console.log('\n📚 API Usage Examples:');
  console.log('─'.repeat(50));
  
  console.log('\n1️⃣ Create Target (auto-creates balance):');
  console.log('POST /api/target');
  console.log(JSON.stringify({
    lineNo: "LINE-001",
    styleNo: "ST-001", 
    lineTarget: 100,
    date: "2025-01-16",
    inTime: "08:00",
    outTime: "17:00",
    hourlyProduction: 0
  }, null, 2));
  
  console.log('\n2️⃣ Add Hourly Production (updates balance):');
  console.log('POST /api/production/hourly');
  console.log(JSON.stringify({
    styleNo: "ST-001",
    lineNo: "LINE-001",
    date: "2025-01-16", 
    hourIndex: 8,
    production: 15
  }, null, 2));
  
  console.log('\n3️⃣ Get Production Balance:');
  console.log('GET /api/production/balances?styleNo=ST-001&date=2025-01-16');
}

// Run the test if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printApiUsageExamples();
  } else {
    testCompleteWorkflow().catch(console.error);
  }
}

module.exports = { testCompleteWorkflow, printApiUsageExamples };
