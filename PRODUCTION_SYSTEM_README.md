# Production Management System

A comprehensive production management system for tracking hourly production per factory line, managing expenses, cashbook, and generating profit & loss reports.

## 🏗️ System Architecture

### Core Entities

#### 1. Factory & Lines
- **Factory**: Production facilities with multiple production lines
- **Line**: Individual production lines within factories (6 lines as specified)
- Each line can be assigned multiple styles and track production across stages

#### 2. Style & Assignments
- **Style**: Garment styles with buyer info, PO numbers, quantities, and pricing
- **StyleAssignment**: Links styles to production lines with start/end dates and hourly targets
- Status tracking: PENDING → RUNNING → WAITING → COMPLETE → CANCELLED

#### 3. Production Tracking
- **ProductionEntry**: Hourly granular tracking (0-23 hours) per line/style/stage
- **Stages**: CUTTING → SEWING → FINISHING
- **Metrics**: Input quantity, output quantity, defects, rework, WIP calculation
- **WIP Formula**: Cumulative input - output per stage

#### 4. Financial Management
- **Expense**: Daily expenses by category (salary, utilities, materials, etc.)
- **Cashbook**: Debit/credit entries with running balance calculation
- **Profit & Loss**: Earned production - expenses = profit

#### 5. Shipment Tracking
- **Shipment**: Style-based shipment records with destination and tracking info
- Revenue recognition on finishing output or shipment (configurable policy)

## 📊 Key Features

### Production Dashboard
- **Real-time Status**: Running/Pending/Complete/Waiting by style & line
- **Hourly Tracking**: Granular production data for each stage
- **WIP Monitoring**: Work-in-progress calculation across stages
- **Efficiency Metrics**: Input/output ratios, defect rates, rework tracking

### Financial Tracking
- **Daily Expenses**: Salary, cash expenses, utilities, maintenance, materials
- **Cashbook**: Debit/credit tracking with running balance
- **Profit & Loss**: Daily/weekly/monthly calculations
- **Revenue Recognition**: Based on finished production output

### Reporting & Analytics
- **Production Reports**: By line, style, date range, stage
- **Shipment Reports**: By style, PO, destination, date
- **Financial Reports**: Expense breakdown, P&L analysis, cash flow
- **Performance Metrics**: Line efficiency, style progress, defect analysis

## 🔐 Role-Based Access Control

### User Roles
- **USER**: View production data, basic reports
- **MANAGER**: Create/update production entries, manage expenses, view all reports
- **ADMIN**: Full system access, user management, system settings
- **SUPER_ADMIN**: Complete system control, audit logs

### Permission Matrix
- Production entries: MANAGER+ (create/update), ADMIN+ (delete)
- Expenses: MANAGER+ (create), ADMIN+ (full access)
- Cashbook: MANAGER+ (create), ADMIN+ (full access)
- Shipments: MANAGER+ (create), ADMIN+ (full access)
- System settings: ADMIN+ only

## 🗄️ Database Schema

### Core Tables
```sql
-- Production tracking
production_entries (id, date, hour_index, line_id, style_id, stage, input_qty, output_qty, defect_qty, rework_qty)

-- Financial management
expenses (id, date, line_id, category_id, amount, payment_method)
cashbook_entries (id, date, type, amount, category, running_balance)

-- Master data
factories (id, name, is_active)
lines (id, factory_id, name, code, is_active)
styles (id, style_number, buyer, po_number, order_qty, unit_price, status)
expense_categories (id, name, is_salary_flag)
```

### Key Relationships
- Line belongs to Factory
- Style assigned to Line via StyleAssignment
- ProductionEntry linked to Line + Style + Stage
- Expense linked to Line + Category
- CashbookEntry linked to Line (optional)

## 🚀 API Endpoints

### Production Management
- `GET/POST /api/production/entries` - Hourly production data
- `GET /api/production/dashboard` - Daily production overview
- `GET /api/production/profit-loss` - P&L calculations

### Financial Management
- `GET/POST /api/expenses` - Expense tracking
- `GET/POST /api/cashbook` - Cashbook entries
- `GET /api/factories` - Factory management
- `GET/POST /api/lines` - Production line management

### Style Management
- `GET/POST /api/styles` - Style and assignment management
- `GET/POST /api/shipments` - Shipment tracking

## 📱 Frontend Components

### Dashboard Views
- **Production Dashboard**: Real-time line status and style progress
- **Financial Dashboard**: Expense overview and P&L summary
- **Line Management**: Factory and line configuration
- **Style Management**: Style creation and line assignment

### Data Entry Forms
- **Hourly Production**: Input/output tracking per stage
- **Expense Entry**: Daily expense recording
- **Cashbook Entry**: Debit/credit transactions
- **Shipment Entry**: Shipment details and tracking

### Reports & Analytics
- **Production Reports**: Filterable by date, line, style, stage
- **Financial Reports**: Expense breakdown, P&L analysis
- **Shipment Reports**: By style, PO, destination
- **Performance Metrics**: Efficiency, defect rates, WIP analysis

## 🛠️ Technical Implementation

### Backend Stack
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control
- **API**: RESTful endpoints with comprehensive validation

### Frontend Stack
- **Framework**: React with TypeScript
- **UI Library**: Tailwind CSS with custom components
- **State Management**: React hooks with context
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Database Features
- **Audit Logging**: Track all changes with user attribution
- **Data Validation**: Comprehensive input validation and business rules
- **Performance**: Optimized queries with proper indexing
- **Scalability**: Designed for high-volume production data

## 📈 Business Logic

### Production Calculations
- **WIP = Input - Output** (per stage)
- **Efficiency = (Output / Input) × 100**
- **Defect Rate = (Defects / Output) × 100**
- **Rework Rate = (Rework / Output) × 100**

### Financial Calculations
- **Revenue = Finished Output × Unit Price**
- **Profit = Revenue - Expenses**
- **Profit Margin = (Profit / Revenue) × 100**
- **Running Balance = Cumulative Credits - Debits**

### Status Logic
- **PENDING**: Style assigned but no production started
- **RUNNING**: Production in progress (any stage has output)
- **WAITING**: Past start date but no production
- **COMPLETE**: Finished output ≥ order quantity
- **CANCELLED**: Manually cancelled orders

## 🔄 Data Flow

### Daily Production Cycle
1. **Morning Setup**: Review line assignments and targets
2. **Hourly Tracking**: Record input/output for each stage
3. **Real-time Updates**: Monitor WIP and efficiency
4. **End-of-Day**: Review production vs. targets, record expenses

### Financial Cycle
1. **Expense Recording**: Daily salary, materials, utilities
2. **Cashbook Updates**: Track all money in/out
3. **Production Revenue**: Calculate earned revenue from finished goods
4. **P&L Calculation**: Daily/weekly/monthly profit analysis

## 📊 Sample Data & Reports

### Production Dashboard Sample
```
Line A - ST001 (Fashion Retailer A)
├── Status: RUNNING
├── Cutting: Input 500, Output 480, WIP 20
├── Sewing: Input 480, Output 450, WIP 30
├── Finishing: Input 450, Output 400, WIP 50
└── Progress: 400/1000 (40% complete)
```

### Financial Summary Sample
```
Daily P&L (2024-01-15)
├── Revenue: $10,200 (400 pieces × $25.50)
├── Expenses: $8,500
│   ├── Salary: $5,000
│   ├── Materials: $2,500
│   └── Utilities: $1,000
├── Profit: $1,700
└── Margin: 16.7%
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npx prisma migrate dev`
5. Seed the database: `npm run seed`
6. Start the development server: `npm run dev`

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/production_db"
JWT_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 🔧 Configuration

### Production Lines
- Default: 6 lines (A, B, C, X, Y, Z)
- Configurable: Add/remove lines per factory
- Flexible: Assign multiple styles per line

### Expense Categories
- **Salary**: Worker compensation
- **Materials**: Raw materials and supplies
- **Utilities**: Power, water, gas
- **Maintenance**: Equipment and facility
- **Transportation**: Shipping and logistics
- **Other**: Miscellaneous expenses

### Reporting Periods
- **Daily**: Current day production and expenses
- **Weekly**: Monday-Sunday summaries
- **Monthly**: Calendar month analysis
- **Custom**: Date range selection

## 📝 Future Enhancements

### Planned Features
- **Real-time Notifications**: Production alerts and milestones
- **Mobile App**: Production tracking on mobile devices
- **Advanced Analytics**: Machine learning for production optimization
- **Integration**: ERP system connectivity
- **Multi-language**: Internationalization support

### Scalability Considerations
- **Database Partitioning**: Time-based partitioning for large datasets
- **Caching**: Redis for frequently accessed data
- **API Rate Limiting**: Protect against abuse
- **Backup Strategy**: Automated database backups
- **Monitoring**: Application performance monitoring

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Maintain consistent code style
- Document API changes
- Update this README for new features

### Code Quality
- ESLint configuration for code standards
- Prettier for code formatting
- Husky for pre-commit hooks
- Comprehensive error handling
- Input validation and sanitization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- API documentation available at `/api/docs`
- Database schema documentation in Prisma schema
- Component documentation in Storybook

### Troubleshooting
- Check database connection and migrations
- Verify environment variables
- Review application logs
- Check Prisma client generation

### Contact
For support and questions, please contact the development team or create an issue in the repository.
