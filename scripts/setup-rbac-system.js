/**
 * Complete RBAC System Setup Script
 * This script sets up the entire Role-Based Access Control system
 * 
 * Usage: 
 *   node scripts/setup-rbac-system.js              # Setup permissions and super admin
 *   node scripts/setup-rbac-system.js --demo       # Also create demo users
 *   node scripts/setup-rbac-system.js --reset      # Reset all data and setup fresh
 */

const { PrismaClient } = require('@prisma/client');
const { setupPermissions } = require('./setup-permissions');
const { createSuperAdmin, createDemoUsers } = require('./create-super-admin');

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️  Resetting database...');
  
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.userPermission.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.permissionModel.deleteMany({});
    await prisma.role.deleteMany({});
    
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

async function setupRBACSystem() {
  console.log('🚀 Setting up complete RBAC system...\n');

  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');
  const shouldCreateDemo = args.includes('--demo');

  try {
    // Step 1: Reset database if requested
    if (shouldReset) {
      await resetDatabase();
      console.log('');
    }

    // Step 2: Setup permissions and roles
    await setupPermissions();
    console.log('');

    // Step 3: Create super admin user
    await createSuperAdmin();
    console.log('');

    // Step 4: Create demo users if requested
    if (shouldCreateDemo) {
      await createDemoUsers();
      console.log('');
    }

    // Step 5: Verify setup
    await verifySetup();

    console.log('🎉 RBAC system setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run database migration: yarn prisma db push');
    console.log('2. Start the application: yarn dev');
    console.log('3. Login with Super Admin credentials');
    console.log('4. Change default passwords');
    console.log('5. Create additional users as needed');

  } catch (error) {
    console.error('💥 RBAC setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...');

  try {
    const [users, permissions, roles, userPermissions, rolePermissions] = await Promise.all([
      prisma.user.count(),
      prisma.permissionModel.count(),
      prisma.role.count(),
      prisma.userPermission.count(),
      prisma.rolePermission.count(),
    ]);

    console.log('📊 Setup Verification:');
    console.log(`✅ Users: ${users}`);
    console.log(`✅ Permissions: ${permissions}`);
    console.log(`✅ Roles: ${roles}`);
    console.log(`✅ User Permissions: ${userPermissions}`);
    console.log(`✅ Role Permissions: ${rolePermissions}`);

    // Check if super admin exists
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (superAdmin) {
      console.log(`✅ Super Admin: ${superAdmin.email}`);
    } else {
      console.log('❌ Super Admin: Not found');
    }

    // Check role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    console.log('\n👥 User Role Distribution:');
    roleDistribution.forEach(({ role, _count }) => {
      console.log(`   ${role}: ${_count.role} users`);
    });

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  setupRBACSystem()
    .then(() => {
      console.log('\n✨ All done! Your RBAC system is ready to use.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupRBACSystem, resetDatabase, verifySetup };
