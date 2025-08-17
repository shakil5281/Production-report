const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting attendance data seeding...');

  try {
    // First, clean existing attendance data
    await prisma.dailyAttendance.deleteMany();
    await prisma.attendanceSummary.deleteMany();
    await prisma.monthlyAttendanceReport.deleteMany();
    await prisma.employee.deleteMany();

    console.log('Cleaned existing attendance data');

    // Sample employees data
    const employees = [
      // CUTTING Department
      { employeeId: 'CUT001', name: 'John Doe', department: 'CUTTING', designation: 'Cutter', shiftType: 'DAY_SHIFT', salary: 25000 },
      { employeeId: 'CUT002', name: 'Jane Smith', department: 'CUTTING', designation: 'Cutting Helper', shiftType: 'DAY_SHIFT', salary: 20000 },
      { employeeId: 'CUT003', name: 'Mike Johnson', department: 'CUTTING', designation: 'Cutting Supervisor', shiftType: 'DAY_SHIFT', salary: 35000 },
      { employeeId: 'CUT004', name: 'Sarah Wilson', department: 'CUTTING', designation: 'Quality Checker', shiftType: 'DAY_SHIFT', salary: 22000 },
      { employeeId: 'CUT005', name: 'David Brown', department: 'CUTTING', designation: 'Cutter', shiftType: 'DAY_SHIFT', salary: 25000 },

      // SEWING Department
      { employeeId: 'SEW001', name: 'Lisa Davis', department: 'SEWING', designation: 'Sewing Operator', shiftType: 'DAY_SHIFT', salary: 23000 },
      { employeeId: 'SEW002', name: 'Tom Wilson', department: 'SEWING', designation: 'Sewing Operator', shiftType: 'DAY_SHIFT', salary: 23000 },
      { employeeId: 'SEW003', name: 'Emma Garcia', department: 'SEWING', designation: 'Line Chief', shiftType: 'DAY_SHIFT', salary: 40000 },
      { employeeId: 'SEW004', name: 'James Martinez', department: 'SEWING', designation: 'Sewing Helper', shiftType: 'DAY_SHIFT', salary: 20000 },
      { employeeId: 'SEW005', name: 'Anna Rodriguez', department: 'SEWING', designation: 'Sewing Operator', shiftType: 'DAY_SHIFT', salary: 23000 },
      { employeeId: 'SEW006', name: 'Robert Lee', department: 'SEWING', designation: 'Sewing Operator', shiftType: 'DAY_SHIFT', salary: 23000 },
      { employeeId: 'SEW007', name: 'Maria Lopez', department: 'SEWING', designation: 'Sewing Supervisor', shiftType: 'DAY_SHIFT', salary: 35000 },

      // FINISHING Department
      { employeeId: 'FIN001', name: 'Carlos Hernandez', department: 'FINISHING', designation: 'Iron Man', shiftType: 'DAY_SHIFT', salary: 25000 },
      { employeeId: 'FIN002', name: 'Jennifer Taylor', department: 'FINISHING', designation: 'Packing Staff', shiftType: 'DAY_SHIFT', salary: 22000 },
      { employeeId: 'FIN003', name: 'Mark Anderson', department: 'FINISHING', designation: 'Finishing Supervisor', shiftType: 'DAY_SHIFT', salary: 35000 },
      { employeeId: 'FIN004', name: 'Jessica White', department: 'FINISHING', designation: 'Finishing Helper', shiftType: 'DAY_SHIFT', salary: 20000 },

      // QUALITY Department
      { employeeId: 'QUA001', name: 'Steven Clark', department: 'QUALITY', designation: 'Quality Inspector', shiftType: 'DAY_SHIFT', salary: 30000 },
      { employeeId: 'QUA002', name: 'Amanda Lewis', department: 'QUALITY', designation: 'Quality Controller', shiftType: 'DAY_SHIFT', salary: 35000 },
      { employeeId: 'QUA003', name: 'Daniel Walker', department: 'QUALITY', designation: 'Quality Assistant', shiftType: 'DAY_SHIFT', salary: 25000 },

      // ADMIN Department
      { employeeId: 'ADM001', name: 'Patricia Hall', department: 'ADMIN', designation: 'HR Manager', shiftType: 'DAY_SHIFT', salary: 45000 },
      { employeeId: 'ADM002', name: 'Richard Allen', department: 'ADMIN', designation: 'Office Assistant', shiftType: 'DAY_SHIFT', salary: 25000 },
      { employeeId: 'ADM003', name: 'Linda Young', department: 'ADMIN', designation: 'Accounts Officer', shiftType: 'DAY_SHIFT', salary: 35000 },

      // MAINTENANCE Department
      { employeeId: 'MNT001', name: 'Christopher King', department: 'MAINTENANCE', designation: 'Electrician', shiftType: 'DAY_SHIFT', salary: 30000 },
      { employeeId: 'MNT002', name: 'Dorothy Wright', department: 'MAINTENANCE', designation: 'Mechanic', shiftType: 'DAY_SHIFT', salary: 28000 },

      // SECURITY Department
      { employeeId: 'SEC001', name: 'Kenneth Lopez', department: 'SECURITY', designation: 'Security Guard', shiftType: 'NIGHT_SHIFT', salary: 20000 },
      { employeeId: 'SEC002', name: 'Helen Hill', department: 'SECURITY', designation: 'Security Supervisor', shiftType: 'DAY_SHIFT', salary: 25000 },

      // STORE Department
      { employeeId: 'STO001', name: 'Paul Green', department: 'STORE', designation: 'Store Keeper', shiftType: 'DAY_SHIFT', salary: 25000 },
      { employeeId: 'STO002', name: 'Nancy Adams', department: 'STORE', designation: 'Store Assistant', shiftType: 'DAY_SHIFT', salary: 20000 },

      // ACCOUNTS Department
      { employeeId: 'ACC001', name: 'Gary Baker', department: 'ACCOUNTS', designation: 'Accountant', shiftType: 'DAY_SHIFT', salary: 40000 },
      { employeeId: 'ACC002', name: 'Sharon Turner', department: 'ACCOUNTS', designation: 'Accounts Assistant', shiftType: 'DAY_SHIFT', salary: 25000 },

      // PRODUCTION Department
      { employeeId: 'PRD001', name: 'Ronald Phillips', department: 'PRODUCTION', designation: 'Production Manager', shiftType: 'DAY_SHIFT', salary: 50000 },
      { employeeId: 'PRD002', name: 'Cynthia Campbell', department: 'PRODUCTION', designation: 'Production Coordinator', shiftType: 'DAY_SHIFT', salary: 35000 },
      { employeeId: 'PRD003', name: 'Kevin Parker', department: 'PRODUCTION', designation: 'Production Assistant', shiftType: 'DAY_SHIFT', salary: 25000 }
    ];

    // Create employees
    console.log('Creating employees...');
    const createdEmployees = [];
    for (const emp of employees) {
      const employee = await prisma.employee.create({
        data: {
          ...emp,
          joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random join date within last year
        }
      });
      createdEmployees.push(employee);
    }
    console.log(`Created ${createdEmployees.length} employees`);

    // Generate attendance data for the last 7 days
    const attendanceStatuses = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE', 'OVERTIME'];
    const today = new Date();
    
    console.log('Generating attendance records...');
    let totalRecords = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      console.log(`Generating attendance for ${date.toISOString().split('T')[0]}...`);

      for (const employee of createdEmployees) {
        // Generate realistic attendance (85% present, 10% late, 3% absent, 2% leave)
        const rand = Math.random();
        let status;
        let inTime = null;
        let outTime = null;
        let workHours = null;
        let overtime = null;
        let remarks = null;

        if (rand < 0.85) {
          status = 'PRESENT';
          inTime = '08:00';
          outTime = '17:00';
          workHours = 8;
          overtime = Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0; // 20% chance of overtime
        } else if (rand < 0.95) {
          status = 'LATE';
          const lateMinutes = Math.floor(Math.random() * 60) + 15; // 15-75 minutes late
          const hour = Math.floor((8 * 60 + lateMinutes) / 60);
          const minute = (8 * 60 + lateMinutes) % 60;
          inTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          outTime = '17:00';
          workHours = Math.max(0, 8 - (lateMinutes / 60));
          remarks = `Late arrival by ${lateMinutes} minutes`;
        } else if (rand < 0.98) {
          status = Math.random() < 0.5 ? 'ABSENT' : 'SICK_LEAVE';
          remarks = status === 'ABSENT' ? 'Unexcused absence' : 'Medical leave';
        } else {
          status = Math.random() < 0.5 ? 'HALF_DAY' : 'CASUAL_LEAVE';
          if (status === 'HALF_DAY') {
            inTime = '08:00';
            outTime = '12:00';
            workHours = 4;
            remarks = 'Half day leave';
          } else {
            remarks = 'Personal leave';
          }
        }

        await prisma.dailyAttendance.create({
          data: {
            date,
            employeeId: employee.id,
            status,
            inTime,
            outTime,
            workHours,
            overtime,
            remarks
          }
        });

        totalRecords++;
      }

      // Generate summary for this date
      const departments = [...new Set(createdEmployees.map(emp => emp.department))];
      
      for (const dept of departments) {
        const deptEmployees = createdEmployees.filter(emp => emp.department === dept);
        const deptAttendance = await prisma.dailyAttendance.findMany({
          where: {
            date,
            employee: { department: dept }
          }
        });

        const present = deptAttendance.filter(a => a.status === 'PRESENT').length;
        const absent = deptAttendance.filter(a => a.status === 'ABSENT').length;
        const late = deptAttendance.filter(a => a.status === 'LATE').length;
        const halfDay = deptAttendance.filter(a => a.status === 'HALF_DAY').length;
        const leave = deptAttendance.filter(a => 
          ['LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE'].includes(a.status)
        ).length;
        const overtime = deptAttendance.filter(a => a.status === 'OVERTIME').length;

        const attendanceRate = deptEmployees.length > 0 ? 
          parseFloat(((present / deptEmployees.length) * 100).toFixed(2)) : 0;

        await prisma.attendanceSummary.create({
          data: {
            date,
            department: dept,
            totalEmployee: deptEmployees.length,
            present,
            absent,
            late,
            halfDay,
            leave,
            overtime,
            attendanceRate
          }
        });
      }
    }

    console.log(`Generated ${totalRecords} attendance records`);

    // Generate monthly report for current month
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    console.log('Generating monthly reports...');
    const departments = [...new Set(createdEmployees.map(emp => emp.department))];

    for (const dept of departments) {
      const deptEmployees = createdEmployees.filter(emp => emp.department === dept);
      
      // Calculate monthly stats (simplified - using last 7 days data)
      const monthlyAttendance = await prisma.dailyAttendance.findMany({
        where: {
          employee: { department: dept },
          date: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const totalPresent = monthlyAttendance.filter(a => a.status === 'PRESENT').length;
      const totalAbsent = monthlyAttendance.filter(a => a.status === 'ABSENT').length;
      const totalLeave = monthlyAttendance.filter(a => 
        ['LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE'].includes(a.status)
      ).length;
      
      const totalOvertime = parseFloat(monthlyAttendance.reduce((sum, a) => sum + parseFloat(a.overtime || 0), 0).toFixed(2));
      const workingDays = 7; // Last 7 days
      const averageAttendance = workingDays > 0 ? 
        parseFloat(((totalPresent / (deptEmployees.length * workingDays)) * 100).toFixed(2)) : 0;

      await prisma.monthlyAttendanceReport.create({
        data: {
          month: currentMonth,
          year: currentYear,
          department: dept,
          totalWorkingDays: workingDays,
          totalPresent,
          totalAbsent,
          totalLeave,
          totalOvertime,
          averageAttendance
        }
      });
    }

    console.log('Generated monthly reports');

    const stats = {
      employees: createdEmployees.length,
      departments: departments.length,
      attendanceRecords: totalRecords,
      summaryRecords: await prisma.attendanceSummary.count(),
      monthlyReports: await prisma.monthlyAttendanceReport.count()
    };

    console.log('\n=== Attendance Data Seeding Completed Successfully ===');
    console.log('Statistics:');
    console.log(`- Employees: ${stats.employees}`);
    console.log(`- Departments: ${stats.departments}`);
    console.log(`- Attendance Records: ${stats.attendanceRecords}`);
    console.log(`- Summary Records: ${stats.summaryRecords}`);
    console.log(`- Monthly Reports: ${stats.monthlyReports}`);
    console.log('\nYou can now:');
    console.log('1. View daily attendance at /attendance/daily');
    console.log('2. Check summary reports at /attendance/summary');
    console.log('3. Test import/export at /attendance/import');

  } catch (error) {
    console.error('Error seeding attendance data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
