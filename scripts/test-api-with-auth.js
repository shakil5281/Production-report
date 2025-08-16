#!/usr/bin/env node

/**
 * Script to test production balance API with authentication
 */

async function testApiWithAuth() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🔐 Testing API with authentication...');
    
    // First, try to login and get a token
    console.log('1. Attempting to login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Update with your admin email
        password: 'admin123' // Update with your admin password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please check your credentials.');
      console.log('💡 Create an admin user first with: node scripts/create-super-admin.js');
      return;
    }

    const loginData = await loginResponse.json();
    if (!loginData.success || !loginData.token) {
      console.log('❌ Login failed:', loginData.error || 'No token received');
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Now test the production balances API
    console.log('2. Testing production balances API...');
    const balanceResponse = await fetch(`${baseUrl}/api/production/balances`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!balanceResponse.ok) {
      console.log(`❌ API call failed: ${balanceResponse.status} ${balanceResponse.statusText}`);
      const errorText = await balanceResponse.text();
      console.log('Error details:', errorText);
      return;
    }

    const balanceData = await balanceResponse.json();
    console.log('✅ API call successful');
    console.log('📊 Response:', JSON.stringify(balanceData, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testApiWithAuth().catch(console.error);
}

module.exports = { testApiWithAuth };
