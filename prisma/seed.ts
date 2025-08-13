import { PrismaClient, UserRole, PermissionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create permissions
  console.log('Creating permissions...');
  const permissions = await Promise.all(
    Object.values(PermissionType).map(async (permissionName) => {
      return prisma.permissionModel.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          description: `Permission to ${permissionName.toLowerCase().replace(/_/g, ' ')}`,
        },
      });
    })
  );

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create roles
  console.log('Creating roles...');
  const roles = await Promise.all(
    Object.values(UserRole).map(async (roleName) => {
      return prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: `${roleName.replace(/_/g, ' ')} role`,
        },
      });
    })
  );

  console.log(`✅ Created ${roles.length} roles`);

  // Create role-permission relationships
  console.log('Creating role-permission relationships...');
  
  const rolePermissions = {
    [UserRole.USER]: [
      PermissionType.READ_PRODUCTION,
      PermissionType.READ_REPORT,
    ],
    [UserRole.MANAGER]: [
      PermissionType.READ_PRODUCTION,
      PermissionType.UPDATE_PRODUCTION,
      PermissionType.CREATE_REPORT,
      PermissionType.READ_REPORT,
      PermissionType.UPDATE_REPORT,
    ],
    [UserRole.ADMIN]: [
      PermissionType.CREATE_PRODUCTION,
      PermissionType.READ_PRODUCTION,
      PermissionType.UPDATE_PRODUCTION,
      PermissionType.DELETE_PRODUCTION,
      PermissionType.CREATE_REPORT,
      PermissionType.READ_REPORT,
      PermissionType.UPDATE_REPORT,
      PermissionType.DELETE_REPORT,
      PermissionType.CREATE_USER,
      PermissionType.READ_USER,
      PermissionType.UPDATE_USER,
    ],
    [UserRole.SUPER_ADMIN]: [
      PermissionType.CREATE_PRODUCTION,
      PermissionType.READ_PRODUCTION,
      PermissionType.UPDATE_PRODUCTION,
      PermissionType.DELETE_PRODUCTION,
      PermissionType.CREATE_REPORT,
      PermissionType.READ_REPORT,
      PermissionType.UPDATE_REPORT,
      PermissionType.DELETE_REPORT,
      PermissionType.CREATE_USER,
      PermissionType.READ_USER,
      PermissionType.UPDATE_USER,
      PermissionType.DELETE_USER,
      PermissionType.MANAGE_SYSTEM,
      PermissionType.MANAGE_ROLES,
      PermissionType.MANAGE_PERMISSIONS,
    ],
  };

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({
      where: { name: roleName as UserRole },
    });

    if (role) {
      for (const permissionName of permissionNames) {
        const permission = await prisma.permissionModel.findUnique({
          where: { name: permissionName },
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }
  }

  console.log('✅ Created role-permission relationships');

  // Create a default super admin user
  console.log('Creating default super admin user...');
  
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: 'admin@example.com' },
  });

  if (!existingSuperAdmin) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    console.log(`✅ Created super admin user: ${superAdmin.email}`);
    console.log('🔑 Default password: Admin123!@#');
  } else {
    console.log('ℹ️ Super admin user already exists');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
