#!/usr/bin/env node

/**
 * Test script for target update API
 * This will help debug the PUT request issue
 */

async function testTargetUpdate() {
  const baseUrl = 'http://localhost:3000';
  const targetId = 'a126f669-0018-4949-860a-0d125cbc9644'; // Your target ID
  
  console.log('🧪 Testing Target Update API');
  console.log('═'.repeat(50));
  console.log(`Target ID: ${targetId}`);
  
  try {
    // First, let's try to get the target to see what data exists
    console.log('\n📋 Step 1: Getting current target data...');
    
    const getResponse = await fetch(`${baseUrl}/api/target/${targetId}`);
    
    if (getResponse.ok) {
      const currentData = await getResponse.json();
      console.log('✅ Current target data:');
      console.log(JSON.stringify(currentData, null, 2));
      
      // Now let's try to update it with the same data plus some modifications
      console.log('\n🔄 Step 2: Testing target update...');
      
      const updateData = {
        lineNo: currentData.data.lineNo || 'LINE-001',
        styleNo: currentData.data.styleNo || 'ST-001',
        lineTarget: currentData.data.lineTarget || 100,
        date: currentData.data.date?.split('T')[0] || '2025-08-16', // Format as YYYY-MM-DD
        inTime: currentData.data.inTime || '08:00',
        outTime: currentData.data.outTime || '17:00',
        hourlyProduction: currentData.data.hourlyProduction || 0
      };
      
      console.log('📤 Sending update data:');
      console.log(JSON.stringify(updateData, null, 2));
      
      const updateResponse = await fetch(`${baseUrl}/api/target/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const updateResult = await updateResponse.json();
      
      if (updateResponse.ok) {
        console.log('✅ Target updated successfully!');
        console.log('📊 Updated target data:');
        console.log(JSON.stringify(updateResult, null, 2));
      } else {
        console.log('❌ Target update failed!');
        console.log(`Status: ${updateResponse.status} ${updateResponse.statusText}`);
        console.log('Error details:');
        console.log(JSON.stringify(updateResult, null, 2));
      }
      
    } else {
      console.log('❌ Failed to get current target data');
      console.log(`Status: ${getResponse.status} ${getResponse.statusText}`);
      
      // Let's try with sample data anyway
      console.log('\n🔄 Step 2: Testing with sample data...');
      
      const sampleData = {
        lineNo: 'LINE-001',
        styleNo: 'ST-001',
        lineTarget: 100,
        date: '2025-08-16',
        inTime: '08:00',
        outTime: '17:00',
        hourlyProduction: 0
      };
      
      console.log('📤 Sending sample data:');
      console.log(JSON.stringify(sampleData, null, 2));
      
      const updateResponse = await fetch(`${baseUrl}/api/target/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleData)
      });
      
      const updateResult = await updateResponse.json();
      
      if (updateResponse.ok) {
        console.log('✅ Target updated with sample data!');
        console.log(JSON.stringify(updateResult, null, 2));
      } else {
        console.log('❌ Target update with sample data failed!');
        console.log(`Status: ${updateResponse.status} ${updateResponse.statusText}`);
        console.log('Error details:');
        console.log(JSON.stringify(updateResult, null, 2));
      }
    }
    
    // Let's also test various error scenarios
    console.log('\n🧪 Step 3: Testing validation scenarios...');
    
    const testCases = [
      {
        name: 'Missing lineNo',
        data: { styleNo: 'ST-001', lineTarget: 100, date: '2025-08-16', inTime: '08:00', outTime: '17:00' }
      },
      {
        name: 'Missing styleNo', 
        data: { lineNo: 'LINE-001', lineTarget: 100, date: '2025-08-16', inTime: '08:00', outTime: '17:00' }
      },
      {
        name: 'Invalid lineTarget',
        data: { lineNo: 'LINE-001', styleNo: 'ST-001', lineTarget: -5, date: '2025-08-16', inTime: '08:00', outTime: '17:00' }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      
      const testResponse = await fetch(`${baseUrl}/api/target/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });
      
      const testResult = await testResponse.json();
      console.log(`   Status: ${testResponse.status}`);
      console.log(`   Response: ${testResult.error || 'Success'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🛠️ Troubleshooting:');
    console.log('   1. Make sure the development server is running');
    console.log('   2. Check if the target ID exists in the database');
    console.log('   3. Verify network connectivity');
  }
}

// Helper function to demonstrate correct API usage
function printCorrectUsage() {
  console.log('\n📚 Correct API Usage for Target Update:');
  console.log('─'.repeat(50));
  console.log('PUT /api/target/{id}');
  console.log('Content-Type: application/json');
  console.log('');
  console.log('Required fields:');
  console.log(JSON.stringify({
    lineNo: 'LINE-001',
    styleNo: 'ST-001', 
    lineTarget: 100,
    date: '2025-08-16',
    inTime: '08:00',
    outTime: '17:00'
  }, null, 2));
  console.log('');
  console.log('Optional fields:');
  console.log('- hourlyProduction: number (defaults to 0)');
}

// Run the test if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printCorrectUsage();
  } else {
    testTargetUpdate().catch(console.error);
  }
}

module.exports = { testTargetUpdate, printCorrectUsage };
