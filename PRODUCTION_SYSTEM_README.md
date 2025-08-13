# Production List System

This document describes the new Production List system that has been integrated with Prisma database for full CRUD operations.

## 🗄️ Database Schema

### ProductionList Model
```prisma
model ProductionList {
  id           String           @id @default(uuid())
  programCode  String           @unique
  buyer        String
  quantity     Int
  item         String
  price        Decimal
  status       ProductionStatus @default(PENDING)
  startDate    DateTime?
  endDate      DateTime?
  notes        String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  
  @@map("production_list")
}

enum ProductionStatus {
  PENDING
  RUNNING
  COMPLETE
  CANCELLED
}
```

## 🚀 Setup Instructions

### 1. Database Migration
Run the following commands to set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name add_production_list

# (Optional) Seed the database with sample data
node scripts/setup-production-db.js
```

### 2. Environment Variables
Ensure your `.env` file contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
```

## 🔧 API Endpoints

### GET /api/production
- **Description**: Fetch all production items
- **Response**: List of production items with pagination info

### POST /api/production
- **Description**: Create a new production item
- **Body**:
  ```json
  {
    "programCode": "PRG-001",
    "buyer": "Buyer A",
    "quantity": 1000,
    "item": "Shirt",
    "price": 10.00,
    "status": "PENDING",
    "startDate": "2024-01-15",
    "endDate": "2024-01-30",
    "notes": "Additional notes"
  }
  ```

### GET /api/production/[id]
- **Description**: Fetch a specific production item by ID
- **Response**: Single production item

### PUT /api/production/[id]
- **Description**: Update an existing production item
- **Body**: Same as POST, but all fields are optional

### DELETE /api/production/[id]
- **Description**: Delete a production item
- **Response**: Deleted item details

## 🎯 Features

### 1. CRUD Operations
- ✅ **Create**: Add new production items with validation
- ✅ **Read**: Fetch all items or individual items by ID
- ✅ **Update**: Modify existing items with full validation
- ✅ **Delete**: Remove items with confirmation

### 2. Data Validation
- Required fields: `programCode`, `buyer`, `quantity`, `item`, `price`
- Unique program codes
- Positive quantity and price values
- Valid status values: `PENDING`, `RUNNING`, `COMPLETE`, `CANCELLED`

### 3. Enhanced Fields
- **Start/End Dates**: Track production timelines
- **Notes**: Additional information and comments
- **Timestamps**: Automatic creation and update tracking

### 4. Status Management
- **PENDING**: Items waiting to start production
- **RUNNING**: Currently active production items
- **COMPLETE**: Finished production items
- **CANCELLED**: Cancelled production items

## 🎨 User Interface

### Production List Page (`/production-list`)
- **Data Table**: Displays all production items with actions
- **Add Item Button**: Opens right-side sheet for new items
- **Status Filter**: Filter items by production status
- **Summary Statistics**: Count of items by status
- **Actions Menu**: View, Edit, Delete operations

### Production Form
- **Create Mode**: Add new production items
- **Edit Mode**: Update existing items
- **View Mode**: Read-only display of item details
- **Validation**: Real-time form validation
- **Enhanced Fields**: Date pickers, notes, status selection

## 🔄 Data Flow

1. **Frontend** → **API Routes** → **Prisma Service** → **Database**
2. **Real-time Updates**: UI automatically reflects database changes
3. **Error Handling**: Comprehensive error messages and validation
4. **State Management**: React hooks for data synchronization

## 🛠️ Technical Implementation

### Backend
- **Prisma ORM**: Type-safe database operations
- **API Routes**: RESTful endpoints with validation
- **Service Layer**: Business logic separation
- **Error Handling**: Comprehensive error management

### Frontend
- **React Hooks**: Custom `useProduction` hook
- **TypeScript**: Full type safety
- **UI Components**: Reusable form and table components
- **State Management**: Local state with API synchronization

## 📊 Sample Data

The system comes with sample production items:
- **PRG-001**: Running production (Shirts)
- **PRG-002**: Pending production (Pants)
- **PRG-003**: Complete production (Jackets)
- **PRG-004**: Running production (T-Shirts)

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Check database permissions

2. **Migration Errors**
   - Run `npx prisma migrate reset` to start fresh
   - Check Prisma schema syntax
   - Verify database compatibility

3. **API Errors**
   - Check browser console for error messages
   - Verify API route implementations
   - Check Prisma client generation

### Debug Mode
Enable debug logging by adding to your `.env`:
```env
DEBUG=prisma:*
```

## 🚀 Future Enhancements

- **Bulk Operations**: Import/export multiple items
- **Advanced Filtering**: Date ranges, price ranges, buyer search
- **Production Tracking**: Progress updates and milestones
- **Reporting**: Analytics and production insights
- **Notifications**: Status change alerts
- **Audit Trail**: Track all changes and modifications

## 📝 API Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully",
  "total": 4
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🤝 Contributing

When adding new features:
1. Update Prisma schema
2. Create database migration
3. Update API endpoints
4. Modify frontend components
5. Update TypeScript interfaces
6. Test all CRUD operations

## 📞 Support

For technical issues or questions:
1. Check this documentation
2. Review error logs
3. Verify database setup
4. Test API endpoints independently
5. Check Prisma documentation

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Database**: PostgreSQL with Prisma ORM
