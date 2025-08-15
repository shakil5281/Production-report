import { PrismaClient, PermissionType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPermissions() {
  try {
    console.log('🔐 Seeding permissions system...');

    // Create all permissions from the enum
    const permissions = Object.values(PermissionType);
    
    for (const permissionType of permissions) {
      await prisma.permissionModel.upsert({
        where: { name: permissionType },
        update: {},
        create: {
          name: permissionType,
          description: getPermissionDescription(permissionType)
        }
      });
    }

    // Get all roles and permissions
    const roles = await prisma.role.findMany();
    const allPermissions = await prisma.permissionModel.findMany();

    // Set up default role permissions
    for (const role of roles) {
      const defaultPermissions = getDefaultPermissionsForRole(role.name as UserRole);
      
      // Clear existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Add new permissions
      for (const permissionType of defaultPermissions) {
        const permission = allPermissions.find(p => p.name === permissionType);
        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }

    console.log('✅ Permissions system seeded successfully!');
    console.log(`Created ${permissions.length} permissions`);
    console.log(`Configured permissions for ${roles.length} roles`);

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getPermissionDescription(permissionType: PermissionType): string {
  const descriptions: Record<PermissionType, string> = {
    // User management
    [PermissionType.CREATE_USER]: 'Create new users in the system',
    [PermissionType.READ_USER]: 'View user information and profiles',
    [PermissionType.UPDATE_USER]: 'Modify user information and settings',
    [PermissionType.DELETE_USER]: 'Remove users from the system',
    
    // Production management
    [PermissionType.CREATE_PRODUCTION]: 'Create new production entries',
    [PermissionType.READ_PRODUCTION]: 'View production data and reports',
    [PermissionType.UPDATE_PRODUCTION]: 'Modify production entries',
    [PermissionType.DELETE_PRODUCTION]: 'Delete production entries',
    
    // Cutting management
    [PermissionType.CREATE_CUTTING]: 'Create cutting records',
    [PermissionType.READ_CUTTING]: 'View cutting data and reports',
    [PermissionType.UPDATE_CUTTING]: 'Modify cutting records',
    [PermissionType.DELETE_CUTTING]: 'Delete cutting records',
    
    // Cashbook management
    [PermissionType.CREATE_CASHBOOK]: 'Create cashbook entries',
    [PermissionType.READ_CASHBOOK]: 'View cashbook data and reports',
    [PermissionType.UPDATE_CASHBOOK]: 'Modify cashbook entries',
    [PermissionType.DELETE_CASHBOOK]: 'Delete cashbook entries',
    
    // Reports
    [PermissionType.CREATE_REPORT]: 'Generate new reports',
    [PermissionType.READ_REPORT]: 'View system reports',
    [PermissionType.UPDATE_REPORT]: 'Modify existing reports',
    [PermissionType.DELETE_REPORT]: 'Delete reports',
    
    // Expense management
    [PermissionType.CREATE_EXPENSE]: 'Create expense records',
    [PermissionType.READ_EXPENSE]: 'View expense data and reports',
    [PermissionType.UPDATE_EXPENSE]: 'Modify expense records',
    [PermissionType.DELETE_EXPENSE]: 'Delete expense records',
    
    // Target management
    [PermissionType.CREATE_TARGET]: 'Create production targets',
    [PermissionType.READ_TARGET]: 'View target data and reports',
    [PermissionType.UPDATE_TARGET]: 'Modify production targets',
    [PermissionType.DELETE_TARGET]: 'Delete production targets',
    
    // Line management
    [PermissionType.CREATE_LINE]: 'Create new production lines',
    [PermissionType.READ_LINE]: 'View production line information',
    [PermissionType.UPDATE_LINE]: 'Modify production line settings',
    [PermissionType.DELETE_LINE]: 'Delete production lines',
    
    // Shipment management
    [PermissionType.CREATE_SHIPMENT]: 'Create shipment records',
    [PermissionType.READ_SHIPMENT]: 'View shipment data and reports',
    [PermissionType.UPDATE_SHIPMENT]: 'Modify shipment records',
    [PermissionType.DELETE_SHIPMENT]: 'Delete shipment records',
    
    // System settings
    [PermissionType.MANAGE_SYSTEM]: 'Manage system-wide settings',
    [PermissionType.MANAGE_ROLES]: 'Manage user roles and permissions',
    [PermissionType.MANAGE_PERMISSIONS]: 'Manage system permissions'
  };

  return descriptions[permissionType] || 'System permission';
}

function getDefaultPermissionsForRole(role: UserRole): PermissionType[] {
  switch (role) {
    case UserRole.USER:
      return [
        PermissionType.READ_PRODUCTION,
        PermissionType.READ_REPORT
      ];
      
    case UserRole.ADMIN:
      return [
        PermissionType.CREATE_PRODUCTION,
        PermissionType.READ_PRODUCTION,
        PermissionType.UPDATE_PRODUCTION,
        PermissionType.DELETE_PRODUCTION,
        PermissionType.CREATE_CUTTING,
        PermissionType.READ_CUTTING,
        PermissionType.UPDATE_CUTTING,
        PermissionType.DELETE_CUTTING,
        PermissionType.CREATE_CASHBOOK,
        PermissionType.READ_CASHBOOK,
        PermissionType.UPDATE_CASHBOOK,
        PermissionType.DELETE_CASHBOOK,
        PermissionType.CREATE_REPORT,
        PermissionType.READ_REPORT,
        PermissionType.UPDATE_REPORT,
        PermissionType.DELETE_REPORT,
        PermissionType.CREATE_EXPENSE,
        PermissionType.READ_EXPENSE,
        PermissionType.UPDATE_EXPENSE,
        PermissionType.DELETE_EXPENSE,
        PermissionType.CREATE_TARGET,
        PermissionType.READ_TARGET,
        PermissionType.UPDATE_TARGET,
        PermissionType.DELETE_TARGET,
        PermissionType.CREATE_LINE,
        PermissionType.READ_LINE,
        PermissionType.UPDATE_LINE,
        PermissionType.DELETE_LINE,
        PermissionType.CREATE_SHIPMENT,
        PermissionType.READ_SHIPMENT,
        PermissionType.UPDATE_SHIPMENT,
        PermissionType.DELETE_SHIPMENT
      ];
      
    case UserRole.SUPER_ADMIN:
      return Object.values(PermissionType);
      
    default:
      return [];
  }
}

if (require.main === module) {
  seedPermissions()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedPermissions;
