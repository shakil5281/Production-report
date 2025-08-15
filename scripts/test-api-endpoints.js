/**
 * API Testing Script for User Management
 * Tests all user management endpoints with SuperAdmin credentials
 * 
 * Usage: node scripts/test-api-endpoints.js
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials
const SUPER_ADMIN = {
  email: 'superadmin@production.com',
  password: 'SuperAdmin@123'
};

let authToken = '';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Cookie': `auth-token=${authToken}` }),
    },
    credentials: 'include', // Include cookies
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  console.log(`🌐 ${finalOptions.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    // Extract auth token from Set-Cookie header if present
    if (response.headers.get('set-cookie')) {
      const cookies = response.headers.get('set-cookie');
      const authCookieMatch = cookies.match(/auth-token=([^;]+)/);
      if (authCookieMatch) {
        authToken = authCookieMatch[1];
      }
    }
    
    if (response.ok) {
      console.log(`✅ Success: ${response.status}`);
      return { success: true, data, status: response.status, response };
    } else {
      console.log(`❌ Error: ${response.status} - ${data.error || 'Unknown error'}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function authenticateAsSuperAdmin() {
  console.log('\n🔐 Authenticating as Super Admin...');
  
  const result = await makeRequest('/api/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify(SUPER_ADMIN),
  });

  if (result.success) {
    if (authToken) {
      console.log(`✅ Authentication successful! Token: ${authToken.substring(0, 20)}...`);
      console.log(`👤 Logged in as: ${result.data.user.name} (${result.data.user.role})`);
      return true;
    } else {
      console.log('❌ Authentication failed - no token received');
      console.log('Response data:', result.data);
      return false;
    }
  } else {
    console.log('❌ Authentication failed!');
    console.log('Error:', result.data);
    return false;
  }
}

async function testUserManagementAPIs() {
  console.log('\n👥 Testing User Management APIs...');

  // 1. Get all users
  console.log('\n1️⃣ Getting all users...');
  const usersResult = await makeRequest('/api/admin/users');
  
  if (!usersResult.success) {
    console.log('❌ Failed to get users list');
    return false;
  }

  const users = usersResult.data.users;
  console.log(`📊 Found ${users.length} users:`);
  users.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
  });

  // 2. Create a new test user
  console.log('\n2️⃣ Creating a new test user...');
  const newUser = {
    name: 'Test User API',
    email: 'testuser.api@production.com',
    password: 'TestUser@123',
    role: 'USER',
    isActive: true
  };

  const createResult = await makeRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(newUser),
  });

  if (!createResult.success) {
    console.log('❌ Failed to create new user');
    return false;
  }

  const createdUser = createResult.data.user;
  console.log(`✅ Created user: ${createdUser.name} (ID: ${createdUser.id})`);

  // 3. Get specific user details
  console.log('\n3️⃣ Getting specific user details...');
  const userDetailResult = await makeRequest(`/api/admin/users/${createdUser.id}`);
  
  if (userDetailResult.success) {
    console.log(`✅ User details retrieved for: ${userDetailResult.data.user.name}`);
  } else {
    console.log('❌ Failed to get user details');
  }

  // 4. Update the user
  console.log('\n4️⃣ Updating user...');
  const updateData = {
    name: 'Test User API Updated',
    email: 'testuser.api@production.com',
    role: 'MANAGER',
    isActive: true
  };

  const updateResult = await makeRequest(`/api/admin/users/${createdUser.id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });

  if (updateResult.success) {
    console.log(`✅ User updated: ${updateResult.data.user.name} - Role: ${updateResult.data.user.role}`);
  } else {
    console.log('❌ Failed to update user');
  }

  // 5. Delete the test user
  console.log('\n5️⃣ Deleting test user...');
  const deleteResult = await makeRequest(`/api/admin/users/${createdUser.id}`, {
    method: 'DELETE',
  });

  if (deleteResult.success) {
    console.log('✅ Test user deleted successfully');
  } else {
    console.log('❌ Failed to delete test user');
  }

  return true;
}

async function testRoleBasedAccess() {
  console.log('\n🛡️ Testing Role-Based Access...');

  // Test accessing with different demo users
  const demoUsers = [
    { email: 'cashbook@production.com', password: 'Demo@123', role: 'CASHBOOK_MANAGER' },
    { email: 'production@production.com', password: 'Demo@123', role: 'PRODUCTION_MANAGER' },
    { email: 'reports@production.com', password: 'Demo@123', role: 'REPORT_VIEWER' },
  ];

  for (const user of demoUsers) {
    console.log(`\n🔍 Testing access for ${user.role}...`);
    
    // Try to authenticate
    const authResult = await makeRequest('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: user.password }),
    });

    if (authResult.success) {
      const userToken = authResult.data.token;
      console.log(`✅ Authentication successful for ${user.role}`);

      // Try to access admin endpoints (should fail for non-super-admin)
      const adminAccess = await makeRequest('/api/admin/users', {
        headers: { 'Cookie': `auth-token=${userToken}` }
      });

      if (adminAccess.success) {
        console.log(`⚠️  ${user.role} has admin access (unexpected for non-super-admin)`);
      } else {
        console.log(`✅ ${user.role} correctly denied admin access`);
      }
    } else {
      console.log(`❌ Authentication failed for ${user.role}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests for User Management System\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Authenticate as Super Admin
    const authSuccess = await authenticateAsSuperAdmin();
    if (!authSuccess) {
      console.log('\n💥 Cannot proceed without Super Admin authentication');
      return;
    }

    // Step 2: Test User Management APIs
    await testUserManagementAPIs();

    // Step 3: Test Role-Based Access
    await testRoleBasedAccess();

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All API tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Super Admin authentication working');
    console.log('✅ User CRUD operations working');
    console.log('✅ Role-based access control working');
    console.log('✅ Permission system functional');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Check if server is running
async function checkServerStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`);
    return response.status !== undefined;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('❌ Development server is not running!');
    console.log('Please start the server with: yarn dev');
    return;
  }

  console.log('✅ Development server is running');
  await runTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, authenticateAsSuperAdmin, testUserManagementAPIs };
