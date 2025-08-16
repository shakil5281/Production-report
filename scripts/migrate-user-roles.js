const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateUserRoles() {
  console.log('🔄 Starting user role migration...');

  try {
    // First, let's see what users we currently have
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    console.log(`📊 Found ${users.length} users to migrate:`);
    
    const roleCounts = {};
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('Current role distribution:', roleCounts);

    // Migration mapping:
    // SUPER_ADMIN -> SUPER_ADMIN (no change)
    // ADMIN, MANAGER, PRODUCTION_MANAGER, CASHBOOK_MANAGER, CUTTING_MANAGER -> USER
    // REPORT_VIEWER -> USER  
    // USER -> USER (no change)

    const roleMapping = {
      'SUPER_ADMIN': 'SUPER_ADMIN',
      'ADMIN': 'USER',
      'MANAGER': 'USER', 
      'PRODUCTION_MANAGER': 'USER',
      'CASHBOOK_MANAGER': 'USER',
      'CUTTING_MANAGER': 'USER',
      'REPORT_VIEWER': 'USER',
      'USER': 'USER'
    };

    console.log('\n📝 Role migration mapping:');
    Object.entries(roleMapping).forEach(([from, to]) => {
      const count = roleCounts[from] || 0;
      if (count > 0) {
        console.log(`  ${from} -> ${to} (${count} users)`);
      }
    });

    // Perform the migration in a transaction
    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        const newRole = roleMapping[user.role];
        if (newRole && newRole !== user.role) {
          console.log(`🔄 Migrating user ${user.email}: ${user.role} -> ${newRole}`);
          
          await tx.user.update({
            where: { id: user.id },
            data: { role: newRole }
          });
        }
      }
    });

    // Verify the migration
    const updatedUsers = await prisma.user.findMany({
      select: {
        role: true,
      }
    });

    const newRoleCounts = {};
    updatedUsers.forEach(user => {
      newRoleCounts[user.role] = (newRoleCounts[user.role] || 0) + 1;
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('New role distribution:', newRoleCounts);
    
    console.log('\n📋 Summary:');
    console.log(`- Super Admins: ${newRoleCounts.SUPER_ADMIN || 0}`);
    console.log(`- Users: ${newRoleCounts.USER || 0}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateUserRoles()
    .then(() => {
      console.log('🎉 User role migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserRoles };
