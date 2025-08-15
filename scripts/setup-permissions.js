/**
 * Setup script for permissions and roles
 * Run this script to initialize the permission system with the new roles and permissions
 * 
 * Usage: node scripts/setup-permissions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// All permission types that should exist in the system
const PERMISSIONS = [
  // User management
  'CREATE_USER',
  'READ_USER',
  'UPDATE_USER',
  'DELETE_USER',
  
  // Production management
  'CREATE_PRODUCTION',
  'READ_PRODUCTION',
  'UPDATE_PRODUCTION',
  'DELETE_PRODUCTION',
  
  // Cutting management
  'CREATE_CUTTING',
  'READ_CUTTING',
  'UPDATE_CUTTING',
  'DELETE_CUTTING',
  
  // Cashbook management
  'CREATE_CASHBOOK',
  'READ_CASHBOOK',
  'UPDATE_CASHBOOK',
  'DELETE_CASHBOOK',
  
  // Reports
  'CREATE_REPORT',
  'READ_REPORT',
  'UPDATE_REPORT',
  'DELETE_REPORT',
  
  // Expense management
  'CREATE_EXPENSE',
  'READ_EXPENSE',
  'UPDATE_EXPENSE',
  'DELETE_EXPENSE',
  
  // Target management
  'CREATE_TARGET',
  'READ_TARGET',
  'UPDATE_TARGET',
  'DELETE_TARGET',
  
  // Line management
  'CREATE_LINE',
  'READ_LINE',
  'UPDATE_LINE',
  'DELETE_LINE',
  
  // Shipment management
  'CREATE_SHIPMENT',
  'READ_SHIPMENT',
  'UPDATE_SHIPMENT',
  'DELETE_SHIPMENT',
  
  // System settings
  'MANAGE_SYSTEM',
  'MANAGE_ROLES',
  'MANAGE_PERMISSIONS',
];

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  USER: [
    'READ_PRODUCTION',
    'READ_REPORT',
  ],
  CASHBOOK_MANAGER: [
    'CREATE_CASHBOOK',
    'READ_CASHBOOK',
    'UPDATE_CASHBOOK',
    'DELETE_CASHBOOK',
    'CREATE_EXPENSE',
    'READ_EXPENSE',
    'UPDATE_EXPENSE',
    'DELETE_EXPENSE',
    'READ_REPORT',
  ],
  PRODUCTION_MANAGER: [
    'CREATE_PRODUCTION',
    'READ_PRODUCTION',
    'UPDATE_PRODUCTION',
    'DELETE_PRODUCTION',
    'CREATE_TARGET',
    'READ_TARGET',
    'UPDATE_TARGET',
    'DELETE_TARGET',
    'CREATE_LINE',
    'READ_LINE',
    'UPDATE_LINE',
    'DELETE_LINE',
    'READ_REPORT',
  ],
  CUTTING_MANAGER: [
    'CREATE_CUTTING',
    'READ_CUTTING',
    'UPDATE_CUTTING',
    'DELETE_CUTTING',
    'READ_PRODUCTION',
    'READ_REPORT',
  ],
  REPORT_VIEWER: [
    'READ_REPORT',
    'READ_PRODUCTION',
    'READ_CASHBOOK',
    'READ_CUTTING',
    'READ_TARGET',
    'READ_EXPENSE',
    'READ_SHIPMENT',
  ],
  MANAGER: [
    'READ_PRODUCTION',
    'UPDATE_PRODUCTION',
    'CREATE_REPORT',
    'READ_REPORT',
    'UPDATE_REPORT',
    'READ_CASHBOOK',
    'READ_CUTTING',
    'READ_TARGET',
    'READ_EXPENSE',
  ],
  ADMIN: [
    'CREATE_PRODUCTION',
    'READ_PRODUCTION',
    'UPDATE_PRODUCTION',
    'DELETE_PRODUCTION',
    'CREATE_CUTTING',
    'READ_CUTTING',
    'UPDATE_CUTTING',
    'DELETE_CUTTING',
    'CREATE_CASHBOOK',
    'READ_CASHBOOK',
    'UPDATE_CASHBOOK',
    'DELETE_CASHBOOK',
    'CREATE_REPORT',
    'READ_REPORT',
    'UPDATE_REPORT',
    'DELETE_REPORT',
    'CREATE_USER',
    'READ_USER',
    'UPDATE_USER',
    'CREATE_EXPENSE',
    'READ_EXPENSE',
    'UPDATE_EXPENSE',
    'DELETE_EXPENSE',
    'CREATE_TARGET',
    'READ_TARGET',
    'UPDATE_TARGET',
    'DELETE_TARGET',
    'CREATE_LINE',
    'READ_LINE',
    'UPDATE_LINE',
    'DELETE_LINE',
  ],
  SUPER_ADMIN: [
    'CREATE_PRODUCTION',
    'READ_PRODUCTION',
    'UPDATE_PRODUCTION',
    'DELETE_PRODUCTION',
    'CREATE_CUTTING',
    'READ_CUTTING',
    'UPDATE_CUTTING',
    'DELETE_CUTTING',
    'CREATE_CASHBOOK',
    'READ_CASHBOOK',
    'UPDATE_CASHBOOK',
    'DELETE_CASHBOOK',
    'CREATE_REPORT',
    'READ_REPORT',
    'UPDATE_REPORT',
    'DELETE_REPORT',
    'CREATE_USER',
    'READ_USER',
    'UPDATE_USER',
    'DELETE_USER',
    'CREATE_EXPENSE',
    'READ_EXPENSE',
    'UPDATE_EXPENSE',
    'DELETE_EXPENSE',
    'CREATE_TARGET',
    'READ_TARGET',
    'UPDATE_TARGET',
    'DELETE_TARGET',
    'CREATE_LINE',
    'READ_LINE',
    'UPDATE_LINE',
    'DELETE_LINE',
    'CREATE_SHIPMENT',
    'READ_SHIPMENT',
    'UPDATE_SHIPMENT',
    'DELETE_SHIPMENT',
    'MANAGE_SYSTEM',
    'MANAGE_ROLES',
    'MANAGE_PERMISSIONS',
  ],
};

async function setupPermissions() {
  console.log('🚀 Setting up permissions and roles...');

  try {
    // 1. Create all permissions if they don't exist
    console.log('📝 Creating permissions...');
    
    for (const permission of PERMISSIONS) {
      await prisma.permissionModel.upsert({
        where: { name: permission },
        update: {},
        create: {
          name: permission,
          description: `Permission to ${permission.toLowerCase().replace(/_/g, ' ')}`,
        },
      });
    }
    
    console.log(`✅ Created/verified ${PERMISSIONS.length} permissions`);

    // 2. Create roles if they don't exist
    console.log('👥 Creating roles...');
    
    const roles = Object.keys(ROLE_PERMISSIONS);
    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role },
        update: {},
        create: {
          name: role,
          description: `${role.replace('_', ' ')} role with specific permissions`,
        },
      });
    }
    
    console.log(`✅ Created/verified ${roles.length} roles`);

    // 3. Clear existing role permissions and recreate them
    console.log('🔗 Setting up role permissions...');
    
    await prisma.rolePermission.deleteMany({});
    
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });
      
      if (!role) {
        console.error(`❌ Role ${roleName} not found`);
        continue;
      }

      for (const permissionName of permissions) {
        const permission = await prisma.permissionModel.findUnique({
          where: { name: permissionName },
        });
        
        if (!permission) {
          console.error(`❌ Permission ${permissionName} not found`);
          continue;
        }

        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
      
      console.log(`✅ Assigned ${permissions.length} permissions to ${roleName}`);
    }

    // 4. Update existing users' permissions based on their roles
    console.log('👤 Updating user permissions...');
    
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      // Clear existing user permissions
      await prisma.userPermission.deleteMany({
        where: { userId: user.id },
      });
      
      // Get role permissions
      const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
      
      for (const permissionName of rolePermissions) {
        const permission = await prisma.permissionModel.findUnique({
          where: { name: permissionName },
        });
        
        if (permission) {
          await prisma.userPermission.create({
            data: {
              userId: user.id,
              permissionId: permission.id,
            },
          });
        }
      }
      
      console.log(`✅ Updated permissions for user ${user.email} (${user.role})`);
    }

    console.log('🎉 Permission setup completed successfully!');
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`- ${PERMISSIONS.length} permissions created`);
    console.log(`- ${roles.length} roles created`);
    console.log(`- ${users.length} users updated`);
    
    const totalRolePermissions = Object.values(ROLE_PERMISSIONS).reduce((sum, perms) => sum + perms.length, 0);
    console.log(`- ${totalRolePermissions} role-permission assignments created`);

  } catch (error) {
    console.error('❌ Error setting up permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupPermissions()
    .then(() => {
      console.log('✨ Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupPermissions };
