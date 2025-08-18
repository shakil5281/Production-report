const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🏭 Setting up production database...');

  try {
    // Step 1: Create Lines
    console.log('\n📊 Creating production lines...');
    const lines = [
      { name: 'Line A', code: 'LINE-A', isActive: true },
      { name: 'Line B', code: 'LINE-B', isActive: true },
      { name: 'Line C', code: 'LINE-C', isActive: true },
      { name: 'Line D', code: 'LINE-D', isActive: true },
      { name: 'Line E', code: 'LINE-E', isActive: true }
    ];

    const createdLines = [];
    for (const line of lines) {
      const created = await prisma.line.upsert({
        where: { code: line.code },
        update: line,
        create: line
      });
      createdLines.push(created);
      console.log(`   ✅ Setup line: ${line.name} (${line.code})`);
    }

    // Step 2: Create Styles
    console.log('\n🎨 Creating styles...');
    const styles = [
      { 
        styleNumber: 'STY-001', 
        buyer: 'Nike Inc.', 
        poNumber: 'PO-NIKE-001',
        orderQty: 1000,
        unitPrice: 15.99,
        plannedStart: new Date('2024-01-15'),
        plannedEnd: new Date('2024-03-15'),
        status: 'RUNNING'
      },
      { 
        styleNumber: 'STY-002', 
        buyer: 'Adidas', 
        poNumber: 'PO-ADIDAS-001',
        orderQty: 800,
        unitPrice: 22.50,
        plannedStart: new Date('2024-01-20'),
        plannedEnd: new Date('2024-03-20'),
        status: 'RUNNING'
      },
      { 
        styleNumber: 'STY-003', 
        buyer: 'H&M', 
        poNumber: 'PO-HM-001',
        orderQty: 600,
        unitPrice: 18.75,
        plannedStart: new Date('2024-02-01'),
        plannedEnd: new Date('2024-04-01'),
        status: 'PENDING'
      }
    ];

    const createdStyles = [];
    for (const style of styles) {
      const created = await prisma.style.create({ data: style });
      createdStyles.push(created);
      console.log(`   ✅ Created style: ${style.styleNumber} for ${style.buyer}`);
    }

    // Step 3: Create Production List Items
    console.log('\n📝 Creating production list...');
    const productionItems = [
      {
        programCode: 'PRG-001',
        styleNo: 'STY-001',
        buyer: 'Nike Inc.',
        item: 'T-Shirt',
        price: 15.99,
        percentage: 25,
        quantities: [
          { qty: 100, color: 'Red', variant: 'S' },
          { qty: 200, color: 'Red', variant: 'M' },
          { qty: 150, color: 'Red', variant: 'L' },
          { qty: 80, color: 'Blue', variant: 'S' },
          { qty: 180, color: 'Blue', variant: 'M' },
          { qty: 120, color: 'Blue', variant: 'L' }
        ],
        totalQty: 830,
        status: 'RUNNING'
      },
      {
        programCode: 'PRG-002',
        styleNo: 'STY-002',
        buyer: 'Adidas',
        item: 'Polo Shirt',
        price: 22.50,
        percentage: 30,
        quantities: [
          { qty: 120, color: 'White', variant: 'M' },
          { qty: 100, color: 'White', variant: 'L' },
          { qty: 80, color: 'Black', variant: 'M' },
          { qty: 100, color: 'Black', variant: 'L' }
        ],
        totalQty: 400,
        status: 'RUNNING'
      },
      {
        programCode: 'PRG-003',
        styleNo: 'STY-003',
        buyer: 'H&M',
        item: 'Hoodie',
        price: 35.00,
        percentage: 20,
        quantities: [
          { qty: 150, color: 'Gray', variant: 'M' },
          { qty: 100, color: 'Gray', variant: 'L' },
          { qty: 80, color: 'Navy', variant: 'M' },
          { qty: 70, color: 'Navy', variant: 'L' }
        ],
        totalQty: 400,
        status: 'PENDING'
      }
    ];

    for (const item of productionItems) {
      await prisma.productionList.create({ data: item });
      console.log(`   ✅ Created production item: ${item.programCode} - ${item.item}`);
    }

    // Step 4: Create Style Assignments (Line-Style assignments)
    console.log('\n🔗 Creating line-style assignments...');
    const assignments = [
      {
        lineId: createdLines[0].id, // Line A
        styleId: createdStyles[0].id, // STY-001
        startDate: new Date(),
        targetPerHour: 250
      },
      {
        lineId: createdLines[1].id, // Line B
        styleId: createdStyles[1].id, // STY-002
        startDate: new Date(),
        targetPerHour: 200
      }
    ];

    for (const assignment of assignments) {
      await prisma.styleAssignment.create({ data: assignment });
      const line = createdLines.find(l => l.id === assignment.lineId);
      const style = createdStyles.find(s => s.id === assignment.styleId);
      console.log(`   ✅ Assigned ${line.name} to ${style.styleNumber} (Target: ${assignment.targetPerHour}/hr)`);
    }

    // Step 5: Create sample targets
    console.log('\n🎯 Creating sample targets...');
    const targets = [
      {
        lineNo: 'LINE-A',
        styleNo: 'STY-001',
        lineTarget: 250,
        date: new Date(),
        inTime: '08:00',
        outTime: '17:00',
        hourlyProduction: 0
      },
      {
        lineNo: 'LINE-B',
        styleNo: 'STY-002',
        lineTarget: 200,
        date: new Date(),
        inTime: '08:00',
        outTime: '17:00',
        hourlyProduction: 0
      }
    ];

    for (const target of targets) {
      await prisma.target.create({ data: target });
      console.log(`   ✅ Created target: ${target.lineNo} - ${target.styleNo} (${target.lineTarget}/hr)`);
    }

    // Step 6: Summary
    console.log('\n📊 Database setup summary:');
    const counts = {
      lines: await prisma.line.count(),
      styles: await prisma.style.count(),
      productionItems: await prisma.productionList.count(),
      assignments: await prisma.styleAssignment.count(),
      targets: await prisma.target.count()
    };

    console.log(`   📍 Lines: ${counts.lines}`);
    console.log(`   🎨 Styles: ${counts.styles}`);
    console.log(`   📝 Production Items: ${counts.productionItems}`);
    console.log(`   🔗 Line Assignments: ${counts.assignments}`);
    console.log(`   🎯 Targets: ${counts.targets}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n💡 You can now:');
    console.log('   1. View production targets in the app');
    console.log('   2. Create new targets using line assignments');
    console.log('   3. Start production reporting');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();