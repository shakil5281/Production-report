const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up production database...');

  try {
    // Create sample production items
    const sampleItems = [
      {
        programCode: 'PRG-001',
        buyer: 'Buyer A',
        quantity: 1000,
        item: 'Shirt',
        price: 10.00,
        status: 'RUNNING',
        startDate: new Date('2024-01-15'),
        notes: 'Premium cotton shirts for summer collection'
      },
      {
        programCode: 'PRG-002',
        buyer: 'Buyer B',
        quantity: 500,
        item: 'Pants',
        price: 20.00,
        status: 'PENDING',
        notes: 'Denim pants for casual wear'
      },
      {
        programCode: 'PRG-003',
        buyer: 'Buyer C',
        quantity: 1500,
        item: 'Jacket',
        price: 30.00,
        status: 'COMPLETE',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-30'),
        notes: 'Winter jackets completed on time'
      },
      {
        programCode: 'PRG-004',
        buyer: 'Buyer D',
        quantity: 750,
        item: 'T-Shirt',
        price: 15.00,
        status: 'RUNNING',
        startDate: new Date('2024-01-20'),
        notes: 'Basic t-shirts for daily wear'
      }
    ];

    for (const item of sampleItems) {
      await prisma.productionList.create({
        data: item
      });
      console.log(`Created production item: ${item.programCode}`);
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
