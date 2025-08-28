const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToMonthlyExpenses() {
  try {
    console.log('🔄 Starting migration to Monthly Expense Management...');

    // Step 1: Create sample monthly expenses for the current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    console.log(`📅 Creating sample monthly expenses for ${currentMonth}/${currentYear}...`);

    const sampleExpenses = [
      {
        month: currentMonth,
        year: currentYear,
        category: 'Electric Bill',
        amount: 15000,
        description: 'Monthly electricity consumption',
        paymentStatus: 'PENDING',
        remarks: 'Due by end of month'
      },
      {
        month: currentMonth,
        year: currentYear,
        category: 'Rent Building',
        amount: 50000,
        description: 'Monthly building rent',
        paymentStatus: 'PENDING',
        remarks: 'Due by 5th of month'
      },
      {
        month: currentMonth,
        year: currentYear,
        category: 'Insurance',
        amount: 8000,
        description: 'Monthly insurance premium',
        paymentStatus: 'PENDING',
        remarks: 'Due by 15th of month'
      },
      {
        month: currentMonth,
        year: currentYear,
        category: 'Water Bill',
        amount: 3000,
        description: 'Monthly water consumption',
        paymentStatus: 'PENDING',
        remarks: 'Due by end of month'
      },
      {
        month: currentMonth,
        year: currentYear,
        category: 'Internet & Phone',
        amount: 5000,
        description: 'Monthly internet and phone services',
        paymentStatus: 'PENDING',
        remarks: 'Due by 20th of month'
      }
    ];

    for (const expense of sampleExpenses) {
      try {
        await prisma.monthlyExpense.create({
          data: expense
        });
        console.log(`✅ Created ${expense.category}: ৳${expense.amount.toLocaleString()}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  ${expense.category} already exists for ${currentMonth}/${currentYear}`);
        } else {
          console.error(`❌ Error creating ${expense.category}:`, error.message);
        }
      }
    }

    // Step 2: Create expenses for previous months (last 3 months)
    const previousMonths = [];
    for (let i = 1; i <= 3; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      previousMonths.push({ month, year });
    }

    for (const { month, year } of previousMonths) {
      console.log(`📅 Creating sample expenses for ${month}/${year}...`);
      
      const previousExpenses = [
        {
          month,
          year,
          category: 'Electric Bill',
          amount: 15000,
          description: 'Monthly electricity consumption',
          paymentStatus: 'PAID',
          paymentDate: new Date(year, month - 1, 15),
          remarks: 'Paid on time'
        },
        {
          month,
          year,
          category: 'Rent Building',
          amount: 50000,
          description: 'Monthly building rent',
          paymentStatus: 'PAID',
          paymentDate: new Date(year, month - 1, 5),
          remarks: 'Paid on time'
        },
        {
          month,
          year,
          category: 'Insurance',
          amount: 8000,
          description: 'Monthly insurance premium',
          paymentStatus: 'PAID',
          paymentDate: new Date(year, month - 1, 15),
          remarks: 'Paid on time'
        }
      ];

      for (const expense of previousExpenses) {
        try {
          await prisma.monthlyExpense.create({
            data: expense
          });
          console.log(`✅ Created ${expense.category} for ${month}/${year}: ৳${expense.amount.toLocaleString()}`);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️  ${expense.category} already exists for ${month}/${year}`);
          } else {
            console.error(`❌ Error creating ${expense.category} for ${month}/${year}:`, error.message);
          }
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Sample monthly expenses created for current month');
    console.log('- Sample expenses created for previous 3 months');
    console.log('- All expenses are categorized (Electric Bill, Rent Building, Insurance, etc.)');
    console.log('\n💡 Next steps:');
    console.log('1. Run the application and navigate to Monthly Expense Management');
    console.log('2. Review and adjust the sample expenses as needed');
    console.log('3. Add more categories or modify existing ones');
    console.log('4. Update Profit & Loss statements will now use monthly expenses / 30');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateToMonthlyExpenses();
