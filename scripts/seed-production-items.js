const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production list items...');

  const productionItems = [
    {
      programCode: 'PG001',
      styleNo: 'ST001',
      buyer: 'Nike',
      item: 'T-Shirt',
      price: 12.50,
      percentage: 85.0,
      quantities: [
        { variant: 'S', color: 'Red', qty: 100 },
        { variant: 'M', color: 'Red', qty: 150 },
        { variant: 'L', color: 'Red', qty: 120 },
        { variant: 'S', color: 'Blue', qty: 80 },
        { variant: 'M', color: 'Blue', qty: 140 },
        { variant: 'L', color: 'Blue', qty: 110 }
      ],
      totalQty: 700,
      status: 'RUNNING'
    },
    {
      programCode: 'PG002',
      styleNo: 'ST002',
      buyer: 'Adidas',
      item: 'Polo Shirt',
      price: 15.75,
      percentage: 92.0,
      quantities: [
        { variant: 'S', color: 'White', qty: 120 },
        { variant: 'M', color: 'White', qty: 180 },
        { variant: 'L', color: 'White', qty: 150 },
        { variant: 'XL', color: 'White', qty: 100 }
      ],
      totalQty: 550,
      status: 'RUNNING'
    },
    {
      programCode: 'PG003',
      styleNo: 'ST003',
      buyer: 'Puma',
      item: 'Tank Top',
      price: 9.25,
      percentage: 78.5,
      quantities: [
        { variant: 'S', color: 'Black', qty: 90 },
        { variant: 'M', color: 'Black', qty: 130 },
        { variant: 'L', color: 'Black', qty: 110 },
        { variant: 'S', color: 'Gray', qty: 85 },
        { variant: 'M', color: 'Gray', qty: 125 },
        { variant: 'L', color: 'Gray', qty: 105 }
      ],
      totalQty: 645,
      status: 'RUNNING'
    },
    {
      programCode: 'PG004',
      styleNo: 'ST004',
      buyer: 'Under Armour',
      item: 'Hoodie',
      price: 28.50,
      percentage: 88.0,
      quantities: [
        { variant: 'S', color: 'Navy', qty: 60 },
        { variant: 'M', color: 'Navy', qty: 90 },
        { variant: 'L', color: 'Navy', qty: 80 },
        { variant: 'XL', color: 'Navy', qty: 70 }
      ],
      totalQty: 300,
      status: 'RUNNING'
    },
    {
      programCode: 'PG005',
      styleNo: 'ST005',
      buyer: 'Champion',
      item: 'Shorts',
      price: 18.00,
      percentage: 80.0,
      quantities: [
        { variant: 'S', color: 'Green', qty: 110 },
        { variant: 'M', color: 'Green', qty: 160 },
        { variant: 'L', color: 'Green', qty: 140 },
        { variant: 'XL', color: 'Green', qty: 90 }
      ],
      totalQty: 500,
      status: 'RUNNING'
    }
  ];

  for (const item of productionItems) {
    try {
      // Check if the item already exists
      const existing = await prisma.productionList.findUnique({
        where: { styleNo: item.styleNo }
      });

      if (existing) {
        console.log(`✓ Production item ${item.styleNo} already exists - updating status to RUNNING`);
        await prisma.productionList.update({
          where: { styleNo: item.styleNo },
          data: { status: 'RUNNING' }
        });
      } else {
        console.log(`+ Creating production item ${item.styleNo}`);
        await prisma.productionList.create({
          data: item
        });
      }
    } catch (error) {
      console.error(`❌ Error processing ${item.styleNo}:`, error.message);
    }
  }

  console.log('✅ Production list seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
