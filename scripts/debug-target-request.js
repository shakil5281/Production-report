#!/usr/bin/env node

/**
 * Debug script to test exactly what's happening with the target update request
 */

async function debugTargetRequest() {
  const baseUrl = 'http://localhost:3000';
  const targetId = 'a126f669-0018-4949-860a-0d125cbc9644';
  
  console.log('🔍 Debugging Target Update Request');
  console.log('═'.repeat(60));
  
  // Test different request formats to see what works
  const testRequests = [
    {
      name: 'Complete Request with All Fields',
      data: {
        lineNo: 'LINE-001',
        styleNo: 'ST-001',
        lineTarget: 100,
        date: '2025-08-16',
        inTime: '08:00',
        outTime: '17:00',
        hourlyProduction: 0
      }
    },
    {
      name: 'Minimal Required Fields Only',
      data: {
        lineNo: 'LINE-001',
        styleNo: 'ST-001',
        lineTarget: 100,
        date: '2025-08-16',
        inTime: '08:00',
        outTime: '17:00'
      }
    },
    {
      name: 'Test with String Numbers',
      data: {
        lineNo: 'LINE-001',
        styleNo: 'ST-001',
        lineTarget: '100',  // String instead of number
        date: '2025-08-16',
        inTime: '08:00',
        outTime: '17:00',
        hourlyProduction: '0'  // String instead of number
      }
    }
  ];
  
  for (const test of testRequests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log('─'.repeat(40));
    console.log('Request Data:');
    console.log(JSON.stringify(test.data, null, 2));
    
    try {
      const response = await fetch(`${baseUrl}/api/target/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(test.data)
      });
      
      const result = await response.json();
      
      console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
      console.log('Response Data:');
      console.log(JSON.stringify(result, null, 2));
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
      } else {
        console.log('❌ FAILED!');
        if (result.receivedData) {
          console.log('\n🔍 Server received data:');
          console.log(JSON.stringify(result.receivedData, null, 2));
        }
      }
      
    } catch (error) {
      console.log('❌ Request Error:', error.message);
    }
    
    console.log('\n' + '═'.repeat(60));
  }
  
  // Test what happens if we send malformed JSON
  console.log('\n🧪 Testing Malformed JSON');
  console.log('─'.repeat(40));
  
  try {
    const response = await fetch(`${baseUrl}/api/target/${targetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"lineNo": "LINE-001", "styleNo": "ST-001"' // Missing closing bracket
    });
    
    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.log('Expected error with malformed JSON:', error.message);
  }
  
  // Test with empty body
  console.log('\n🧪 Testing Empty Body');
  console.log('─'.repeat(40));
  
  try {
    const response = await fetch(`${baseUrl}/api/target/${targetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('Error with empty body:', error.message);
  }
}

// Helper function to show curl command examples
function showCurlExamples() {
  const targetId = 'a126f669-0018-4949-860a-0d125cbc9644';
  
  console.log('\n📚 cURL Command Examples:');
  console.log('─'.repeat(50));
  
  console.log('\n1️⃣ Complete Update Request:');
  console.log(`curl -X PUT http://localhost:3000/api/target/${targetId} \\
  -H "Content-Type: application/json" \\
  -d '{
    "lineNo": "LINE-001",
    "styleNo": "ST-001",
    "lineTarget": 100,
    "date": "2025-08-16",
    "inTime": "08:00",
    "outTime": "17:00",
    "hourlyProduction": 0
  }'`);
  
  console.log('\n2️⃣ Minimal Update Request:');
  console.log(`curl -X PUT http://localhost:3000/api/target/${targetId} \\
  -H "Content-Type: application/json" \\
  -d '{
    "lineNo": "LINE-001",
    "styleNo": "ST-001",
    "lineTarget": 100,
    "date": "2025-08-16",
    "inTime": "08:00",
    "outTime": "17:00"
  }'`);
}

// Run based on arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--curl') || args.includes('-c')) {
    showCurlExamples();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  node debug-target-request.js       # Run debug tests');
    console.log('  node debug-target-request.js -c    # Show curl examples');
    console.log('  node debug-target-request.js -h    # Show this help');
  } else {
    debugTargetRequest().catch(console.error);
  }
}

module.exports = { debugTargetRequest, showCurlExamples };
