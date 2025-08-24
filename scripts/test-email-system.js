/**
 * Test Script for Comprehensive Target Report Email System
 * 
 * This script tests the email system with sample data to ensure
 * all components are working correctly.
 * 
 * Usage: node scripts/test-email-system.js
 */

const { EmailService } = require('../lib/services/email-service');

// Sample data for testing
const sampleData = {
  date: new Date().toISOString(),
  reportData: [
    {
      id: '1',
      lineNo: 'L01',
      lineName: 'Line 1',
      styleNo: 'ST001',
      buyer: 'Test Buyer',
      item: 'Test Item',
      target: 1000,
      hours: 8,
      totalTargets: 1000,
      hourlyProduction: {
        '08:00-12:00': 250,
        '12:00-16:00': 300,
        '16:00-20:00': 200
      },
      totalProduction: 750,
      averageProductionPerHour: 93.75
    },
    {
      id: '2',
      lineNo: 'L02',
      lineName: 'Line 2',
      styleNo: 'ST002',
      buyer: 'Test Buyer 2',
      item: 'Test Item 2',
      target: 1200,
      hours: 8,
      totalTargets: 1200,
      hourlyProduction: {
        '08:00-12:00': 300,
        '12:00-16:00': 350,
        '16:00-20:00': 250
      },
      totalProduction: 900,
      averageProductionPerHour: 112.5
    }
  ],
  summary: {
    totalLines: 2,
    totalTarget: 2200,
    totalProduction: 1650,
    averageProductionPerHour: 103.125,
    date: new Date().toISOString().split('T')[0]
  },
  timeSlotHeaders: ['08:00-12:00', '12:00-16:00', '16:00-20:00'],
  timeSlotTotals: {
    '08:00-12:00': 550,
    '12:00-16:00': 650,
    '16:00-20:00': 450
  }
};

async function testEmailSystem() {
  console.log('🧪 Testing Comprehensive Target Report Email System...\n');

  try {
    // Test 1: Email Service Initialization
    console.log('1️⃣ Testing Email Service Initialization...');
    const emailService = new EmailService();
    console.log('✅ Email service initialized successfully\n');

    // Test 2: Configuration Verification
    console.log('2️⃣ Testing Email Configuration...');
    const isConfigValid = await emailService.verifyConfig();
    if (isConfigValid) {
      console.log('✅ Email configuration verified successfully\n');
    } else {
      console.log('❌ Email configuration verification failed\n');
      console.log('⚠️  Please check your environment variables:\n');
      console.log('   - EMAIL_APP_PASSWORD');
      console.log('   - EMAIL_FROM_ADDRESS');
      console.log('   - EMAIL_FROM_NAME');
      return;
    }

    // Test 3: Target Report Email Generation
    console.log('3️⃣ Testing Target Report Email Generation...');
    const result = await emailService.sendTargetReportEmail(sampleData);
    
    if (result.success) {
      console.log('✅ Target report email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}\n`);
    } else {
      console.log('❌ Failed to send target report email');
      console.log(`Error: ${result.error}\n`);
    }

    // Test 4: Generic Email Sending
    console.log('4️⃣ Testing Generic Email Sending...');
    const genericResult = await emailService.sendEmail({
      to: process.env.EMAIL_TO_ADDRESS || process.env.EMAIL_FROM_ADDRESS,
      subject: 'Test Email from Production Management System',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the email system is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `
    });

    if (genericResult.success) {
      console.log('✅ Generic email sent successfully!');
      console.log(`📧 Message ID: ${genericResult.messageId}\n`);
    } else {
      console.log('❌ Failed to send generic email');
      console.log(`Error: ${genericResult.error}\n`);
    }

    console.log('🎉 Email system testing completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Environment check
function checkEnvironment() {
  console.log('🔍 Checking Environment Configuration...\n');
  
  const requiredVars = [
    'EMAIL_APP_PASSWORD',
    'EMAIL_FROM_ADDRESS',
    'EMAIL_FROM_NAME'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n📝 Please set these variables in your .env.local file');
    console.log('💡 You can copy from env.example and update the values\n');
    return false;
  }

  console.log('✅ All required environment variables are set\n');
  return true;
}

// Main execution
async function main() {
  console.log('🚀 Production Management System - Email System Test\n');
  
  if (!checkEnvironment()) {
    process.exit(1);
  }

  await testEmailSystem();
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEmailSystem, checkEnvironment };
