import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNavigationSystem() {
  try {
    console.log('🌱 Seeding navigation system...');

    // Create roles
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: UserRole.SUPER_ADMIN },
        update: {},
        create: {
          name: UserRole.SUPER_ADMIN,
          description: 'Super Administrator with full system access'
        }
      }),
      prisma.role.upsert({
        where: { name: UserRole.ADMIN },
        update: {},
        create: {
          name: UserRole.ADMIN,
          description: 'Administrator with management access'
        }
      }),
      prisma.role.upsert({
        where: { name: UserRole.USER },
        update: {},
        create: {
          name: UserRole.USER,
          description: 'Regular user with limited access'
        }
      })
    ]);

    const superAdminRole = roles.find(r => r.name === UserRole.SUPER_ADMIN)!;
    const adminRole = roles.find(r => r.name === UserRole.ADMIN)!;
    const userRole = roles.find(r => r.name === UserRole.USER)!;

    // Create main navigation items
    const dashboardNav = await prisma.navigationItem.upsert({
      where: { url: '/dashboard' },
      update: {},
      create: {
        title: 'Dashboard',
        url: '/dashboard',
        icon: 'IconDashboard',
        order: 1,
        isActive: true,
        isPublic: false
      }
    });

    const platformNav = await prisma.navigationItem.upsert({
      where: { url: '/platform' },
      update: {},
      create: {
        title: 'Platform',
        url: '/platform',
        icon: 'IconApps',
        order: 2,
        isActive: true,
        isPublic: false
      }
    });

    const productionReportsNav = await prisma.navigationItem.upsert({
      where: { url: '/production-reports' },
      update: {},
      create: {
        title: 'Production Reports',
        url: '/production-reports',
        icon: 'IconFileText',
        order: 3,
        isActive: true,
        isPublic: false
      }
    });

    const profitLossNav = await prisma.navigationItem.upsert({
      where: { url: '/profit-loss' },
      update: {},
      create: {
        title: 'Profit & Loss',
        url: '/profit-loss',
        icon: 'IconTrendingUp',
        order: 4,
        isActive: true,
        isPublic: false
      }
    });

    // Create group navigation items
    const productionGroupNav = await prisma.navigationItem.upsert({
      where: { url: '/production' },
      update: {},
      create: {
        title: 'Production',
        url: '/production',
        icon: 'IconChartBar',
        order: 5,
        isActive: true,
        isPublic: false
      }
    });

    const expenseGroupNav = await prisma.navigationItem.upsert({
      where: { url: '/expenses' },
      update: {},
      create: {
        title: 'Expenses',
        url: '/expenses',
        icon: 'IconCurrencyDollar',
        order: 6,
        isActive: true,
        isPublic: false
      }
    });

    const cashbookGroupNav = await prisma.navigationItem.upsert({
      where: { url: '/cashbook' },
      update: {},
      create: {
        title: 'Cashbook',
        url: '/cashbook',
        icon: 'IconWallet',
        order: 7,
        isActive: true,
        isPublic: false
      }
    });

    const cuttingGroupNav = await prisma.navigationItem.upsert({
      where: { url: '/cutting' },
      update: {},
      create: {
        title: 'Cutting',
        url: '/cutting',
        icon: 'IconScissors',
        order: 8,
        isActive: true,
        isPublic: false
      }
    });

    const shipmentsGroupNav = await prisma.navigationItem.upsert({
      where: { url: '/shipments' },
      update: {},
      create: {
        title: 'Shipments',
        url: '/shipments',
        icon: 'IconReport',
        order: 9,
        isActive: true,
        isPublic: false
      }
    });

    const administrationGroupNav = await prisma.navigationItem.upsert({
      where: { url: '/admin' },
      update: {},
      create: {
        title: 'Administration',
        url: '/admin',
        icon: 'IconSettings',
        order: 10,
        isActive: true,
        isPublic: false
      }
    });

    // Create sub-navigation items for Production
    const productionSubItems = [
      { title: 'Production List', url: '/production-list', order: 1 },
      { title: 'Target', url: '/target', order: 2 },
      { title: 'Daily Target Report', url: '/target/daily-report', order: 3 },
      { title: 'Comprehensive Target Report', url: '/target/comprehensive-report', order: 4 },
      { title: 'Lines', url: '/lines', order: 5 },
      { title: 'Daily Production', url: '/daily-production', order: 6 }
    ];

    for (const item of productionSubItems) {
      await prisma.navigationItem.upsert({
        where: { url: item.url },
        update: {},
        create: {
          title: item.title,
          url: item.url,
          parentId: productionGroupNav.id,
          order: item.order,
          isActive: true,
          isPublic: false
        }
      });
    }

    // Create sub-navigation items for Expenses
    const expenseSubItems = [
      { title: 'Manpower', url: '/expenses/manpower', order: 1 },
      { title: 'Daily Salary', url: '/expenses/daily-salary', order: 2 },
      { title: 'Daily Expense', url: '/expenses/daily-expense', order: 3 }
    ];

    for (const item of expenseSubItems) {
      await prisma.navigationItem.upsert({
        where: { url: item.url },
        update: {},
        create: {
          title: item.title,
          url: item.url,
          parentId: expenseGroupNav.id,
          order: item.order,
          isActive: true,
          isPublic: false
        }
      });
    }

    // Create sub-navigation items for Cashbook
    const cashbookSubItems = [
      { title: 'Summary', url: '/cashbook', order: 1 },
      { title: 'Cash Received', url: '/cashbook/cash-received', order: 2 },
      { title: 'Daily Expense', url: '/cashbook/daily-expense', order: 3 },
      { title: 'Monthly Express Report', url: '/cashbook/monthly-express-report', order: 4 }
    ];

    for (const item of cashbookSubItems) {
      await prisma.navigationItem.upsert({
        where: { url: item.url },
        update: {},
        create: {
          title: item.title,
          url: item.url,
          parentId: cashbookGroupNav.id,
          order: item.order,
          isActive: true,
          isPublic: false
        }
      });
    }

    // Create sub-navigation items for Administration (SUPER_ADMIN only)
    const adminSubItems = [
      { title: 'Admin Dashboard', url: '/admin/dashboard', order: 1 },
      { title: 'User Management', url: '/admin/users', order: 2 },
      { title: 'Role Management', url: '/admin/roles', order: 3 },
      { title: 'Permissions', url: '/admin/permissions', order: 4 },
      { title: 'Permission Management', url: '/admin/permission-management', order: 5 },
      { title: 'Navigation Management', url: '/admin/navigation', order: 6 },
      { title: 'System Settings', url: '/admin/settings', order: 7 },
      { title: 'API Routes', url: '/admin/api-routes', order: 8 },
      { title: 'System Logs', url: '/admin/logs', order: 9 },
      { title: 'Database Manager', url: '/admin/database', order: 10 },
      { title: 'Backup & Recovery', url: '/admin/backup', order: 11 }
    ];

    for (const item of adminSubItems) {
      await prisma.navigationItem.upsert({
        where: { url: item.url },
        update: {},
        create: {
          title: item.title,
          url: item.url,
          parentId: administrationGroupNav.id,
          order: item.order,
          isActive: true,
          isPublic: false
        }
      });
    }

    // Create permissions for navigation items
    const allNavItems = await prisma.navigationItem.findMany();

    for (const navItem of allNavItems) {
      // Dashboard and Platform - accessible to all roles
      if (['/dashboard', '/platform'].includes(navItem.url)) {
        await prisma.navigationPermission.createMany({
          data: [
            { navigationId: navItem.id, roleId: superAdminRole.id, canAccess: true },
            { navigationId: navItem.id, roleId: adminRole.id, canAccess: true },
            { navigationId: navItem.id, roleId: userRole.id, canAccess: true }
          ],
          skipDuplicates: true
        });
      }
      // Admin routes - SUPER_ADMIN only
      else if (navItem.url.startsWith('/admin')) {
        await prisma.navigationPermission.create({
          data: {
            navigationId: navItem.id,
            roleId: superAdminRole.id,
            canAccess: true
          }
        }).catch(() => {}); // Ignore duplicates
      }
      // Other routes - ADMIN and SUPER_ADMIN
      else {
        await prisma.navigationPermission.createMany({
          data: [
            { navigationId: navItem.id, roleId: superAdminRole.id, canAccess: true },
            { navigationId: navItem.id, roleId: adminRole.id, canAccess: true }
          ],
          skipDuplicates: true
        });
      }
    }

    console.log('✅ Navigation system seeded successfully!');
    console.log(`Created ${allNavItems.length} navigation items`);
    console.log(`Created ${roles.length} roles`);
  } catch (error) {
    console.error('❌ Error seeding navigation system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedNavigationSystem()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedNavigationSystem;
