/**
 * Create Super Admin User Script
 * Run this script to create a default super admin user
 * 
 * Usage: node scripts/create-super-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🔐 Creating Super Admin user...');

  try {
    // Default super admin credentials (should be changed after first login)
    const defaultAdmin = {
      name: 'Super Administrator',
      email: 'superadmin@production.com',
      password: 'SuperAdmin@123', // CHANGE THIS AFTER FIRST LOGIN!
      role: 'SUPER_ADMIN'
    };

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: defaultAdmin.email },
    });

    if (existingAdmin) {
      console.log(`⚠️  Super Admin user already exists: ${defaultAdmin.email}`);
      
      // Update role to SUPER_ADMIN if needed
      if (existingAdmin.role !== 'SUPER_ADMIN') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'SUPER_ADMIN' },
        });
        console.log('✅ Updated existing user role to SUPER_ADMIN');
      }
      
      return existingAdmin;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(defaultAdmin.password, saltRounds);

    // Create the super admin user
    const superAdmin = await prisma.user.create({
      data: {
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        password: hashedPassword,
        role: defaultAdmin.role,
        isActive: true,
      },
    });

    console.log('✅ Super Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log(`Email: ${defaultAdmin.email}`);
    console.log(`Password: ${defaultAdmin.password}`);
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');

    // Assign all super admin permissions
    console.log('\n🔗 Assigning Super Admin permissions...');

    // Get all permissions
    const permissions = await prisma.permissionModel.findMany();
    
    // Create user permissions for all permissions
    const userPermissions = permissions.map(permission => ({
      userId: superAdmin.id,
      permissionId: permission.id,
    }));

    if (userPermissions.length > 0) {
      await prisma.userPermission.createMany({
        data: userPermissions,
      });
      console.log(`✅ Assigned ${permissions.length} permissions to Super Admin`);
    }

    return superAdmin;

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Create demo users for testing
async function createDemoUsers() {
  console.log('\n👥 Creating demo users for testing...');

  const demoUsers = [
    {
      name: 'John Cash',
      email: 'cashbook@production.com',
      password: 'Demo@123',
      role: 'CASHBOOK_MANAGER'
    },
    {
      name: 'Jane Production',
      email: 'production@production.com',
      password: 'Demo@123',
      role: 'PRODUCTION_MANAGER'
    },
    {
      name: 'Bob Cutting',
      email: 'cutting@production.com',
      password: 'Demo@123',
      role: 'CUTTING_MANAGER'
    },
    {
      name: 'Alice Reports',
      email: 'reports@production.com',
      password: 'Demo@123',
      role: 'REPORT_VIEWER'
    },
    {
      name: 'Mike Manager',
      email: 'manager@production.com',
      password: 'Demo@123',
      role: 'MANAGER'
    }
  ];

  try {
    const saltRounds = 12;

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isActive: true,
        },
      });

      // Assign role-based permissions
      await assignRolePermissions(user.id, userData.role);

      console.log(`✅ Created demo user: ${userData.email} (${userData.role})`);
    }

    console.log('\n📋 Demo User Credentials:');
    demoUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
    throw error;
  }
}

// Helper function to assign role-based permissions
async function assignRolePermissions(userId, role) {
  const rolePermissions = {
    CASHBOOK_MANAGER: [
      'CREATE_CASHBOOK', 'READ_CASHBOOK', 'UPDATE_CASHBOOK', 'DELETE_CASHBOOK',
      'CREATE_EXPENSE', 'READ_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
      'READ_REPORT',
    ],
    PRODUCTION_MANAGER: [
      'CREATE_PRODUCTION', 'READ_PRODUCTION', 'UPDATE_PRODUCTION', 'DELETE_PRODUCTION',
      'CREATE_TARGET', 'READ_TARGET', 'UPDATE_TARGET', 'DELETE_TARGET',
      'CREATE_LINE', 'READ_LINE', 'UPDATE_LINE', 'DELETE_LINE',
      'READ_REPORT',
    ],
    CUTTING_MANAGER: [
      'CREATE_CUTTING', 'READ_CUTTING', 'UPDATE_CUTTING', 'DELETE_CUTTING',
      'READ_PRODUCTION', 'READ_REPORT',
    ],
    REPORT_VIEWER: [
      'READ_REPORT', 'READ_PRODUCTION', 'READ_CASHBOOK', 'READ_CUTTING',
      'READ_TARGET', 'READ_EXPENSE', 'READ_SHIPMENT',
    ],
    MANAGER: [
      'READ_PRODUCTION', 'UPDATE_PRODUCTION', 'CREATE_REPORT', 'READ_REPORT',
      'UPDATE_REPORT', 'READ_CASHBOOK', 'READ_CUTTING', 'READ_TARGET', 'READ_EXPENSE',
    ],
  };

  const permissions = rolePermissions[role] || [];
  
  for (const permissionName of permissions) {
    const permission = await prisma.permissionModel.findUnique({
      where: { name: permissionName },
    });
    
    if (permission) {
      await prisma.userPermission.create({
        data: {
          userId: userId,
          permissionId: permission.id,
        },
      });
    }
  }
}

// Run the script if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const createDemo = args.includes('--demo');

  createSuperAdmin()
    .then(async () => {
      if (createDemo) {
        await createDemoUsers();
      }
      console.log('\n🎉 User creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 User creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createSuperAdmin, createDemoUsers };
