# Monthly Expense Management System

## Overview

The Monthly Expense Management System replaces the previous Daily Salary Management and Daily Expense Management with a more structured approach to managing recurring monthly operational expenses.

## Key Features

### 1. Monthly Expense Categories
- **Electric Bill** - Monthly electricity consumption
- **Rent Building** - Monthly building rent
- **Insurance** - Monthly insurance premiums
- **Water Bill** - Monthly water consumption
- **Internet & Phone** - Monthly communication services
- **Maintenance** - Monthly maintenance costs
- **Security** - Monthly security services
- **Cleaning** - Monthly cleaning services
- **Office Supplies** - Monthly office supplies
- **Legal & Professional** - Monthly legal and professional fees
- **Miscellaneous** - Other monthly expenses

### 2. Expense Management
- Create, edit, and delete monthly expenses
- Set payment status (Pending, Paid, Overdue, Cancelled)
- Add payment dates and remarks
- Prevent duplicate expenses for the same category in the same month/year

### 3. Financial Reporting
- Monthly expense summaries
- Category-wise breakdowns
- Payment status tracking
- Integration with Profit & Loss statements

## Database Schema

### MonthlyExpense Model
```prisma
model MonthlyExpense {
  id              String   @id @default(uuid())
  month           Int      // 1-12
  year            Int      // 2024, 2025, etc
  category        String   // Expense category
  amount          Decimal  @default(0)
  description     String?
  paymentDate     DateTime?
  paymentStatus   PaymentStatus @default(PENDING)
  remarks         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([month, year, category])
  @@map("monthly_expenses")
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}
```

## API Endpoints

### GET /api/expenses/monthly
Fetch monthly expenses for a specific month and year.

**Query Parameters:**
- `month` (required): Month number (1-12)
- `year` (required): Year (e.g., 2024)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "month": 1,
      "year": 2024,
      "category": "Electric Bill",
      "amount": 15000,
      "description": "Monthly electricity consumption",
      "paymentDate": "2024-01-15T00:00:00.000Z",
      "paymentStatus": "PAID",
      "remarks": "Paid on time"
    }
  ]
}
```

### POST /api/expenses/monthly
Create a new monthly expense.

**Request Body:**
```json
{
  "month": 1,
  "year": 2024,
  "category": "Electric Bill",
  "amount": 15000,
  "description": "Monthly electricity consumption",
  "paymentDate": "2024-01-15",
  "paymentStatus": "PENDING",
  "remarks": "Due by end of month"
}
```

### PUT /api/expenses/monthly/[id]
Update an existing monthly expense.

### DELETE /api/expenses/monthly/[id]
Delete a monthly expense.

## Profit & Loss Integration

### Daily Equivalent Calculation
Monthly expenses are converted to daily equivalents for profit & loss calculations:

```
Daily Equivalent = Total Monthly Expenses / 30
```

### Updated P&L Formula
```
Net Profit = Daily Production Earnings - Daily Equivalent Monthly Expenses - Daily Cash Expenses
```

This ensures that monthly expenses are properly distributed across daily operations for accurate financial reporting.

## Migration from Old System

### What Was Removed
- Daily Salary Management (`/salary/daily`)
- Daily Expense Management (`/expenses/daily-expense`)
- Daily Salary Management (`/expenses/daily-salary`)

### What Was Added
- Monthly Expense Management (`/expenses/monthly-expense`)
- New database models for monthly expenses
- Updated profit & loss calculations

### Migration Script
Run the migration script to populate sample data:

```bash
node scripts/migrate-to-monthly-expenses.js
```

## Usage Instructions

### 1. Access Monthly Expense Management
Navigate to **Expense Management > Monthly Expenses** in the sidebar.

### 2. Add New Monthly Expense
1. Click "Add Monthly Expense" button
2. Select month and year
3. Choose expense category
4. Enter amount and description
5. Set payment status and date
6. Add remarks if needed
7. Click "Add Expense"

### 3. Manage Existing Expenses
- **Edit**: Click the edit button to modify expense details
- **Delete**: Click the delete button to remove expenses
- **Filter**: Use month/year selectors to view specific periods

### 4. Monitor Financial Health
- View total expenses by month
- Track payment status (Paid, Pending, Overdue)
- Analyze category-wise expense distribution
- Monitor payment due dates

## Benefits of the New System

### 1. Better Financial Planning
- Predictable monthly expense structure
- Clear visibility into recurring costs
- Better cash flow management

### 2. Improved Reporting
- Monthly expense summaries
- Category-wise analysis
- Payment status tracking
- Integration with P&L statements

### 3. Operational Efficiency
- Reduced manual data entry
- Consistent expense categorization
- Better audit trails
- Automated daily equivalent calculations

## Future Enhancements

### 1. Expense Forecasting
- Predict future expenses based on historical data
- Budget planning and variance analysis
- Seasonal expense patterns

### 2. Payment Automation
- Automated payment reminders
- Integration with banking systems
- Payment scheduling

### 3. Advanced Analytics
- Expense trend analysis
- Cost optimization recommendations
- Department-wise expense allocation

## Troubleshooting

### Common Issues

1. **Duplicate Expense Error**
   - Ensure only one expense per category per month/year
   - Check existing expenses before adding new ones

2. **Database Connection Issues**
   - Verify Prisma configuration
   - Check database connectivity
   - Run database migrations if needed

3. **API Errors**
   - Check request format and required fields
   - Verify authentication and permissions
   - Review server logs for detailed error messages

### Support
For technical support or questions about the Monthly Expense Management System, please contact the development team or refer to the system logs for detailed error information.
