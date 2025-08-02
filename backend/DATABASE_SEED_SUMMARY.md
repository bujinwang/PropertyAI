# Database Seed Summary

## Overview
The PropertyAI database has been successfully seeded with comprehensive test data that conforms to the Prisma schema. This includes both PostgreSQL (relational data) and MongoDB (AI/analytics data) seeding.

**Database Schema**: `propertyai` (PostgreSQL)
**Connection**: `postgresql://postgres:postgres@localhost:5432/propertyai`

## PostgreSQL Data Seeded

### 🔐 Authentication & Authorization
- **8 Permissions**: Basic CRUD permissions for users and properties
- **3 Roles**: ADMIN, PROPERTY_MANAGER, TENANT with appropriate permissions
- **10 Users**: Including admin, property managers, and tenants with hashed passwords

### 🏢 Properties & Units
- **5 Properties**: 
  - Sunrise Apartments (San Francisco) - 24 units
  - Parkview Townhomes (San Jose) - 12 units  
  - Oakridge House (Palo Alto) - 1 unit
  - Bayview Condos (Oakland) - 36 units
  - Tech Plaza (Mountain View) - 15 units
- **12 Units**: Mix of residential and commercial spaces with detailed features
- **6 Leases**: Active leases for occupied units with realistic terms

### 🔧 Maintenance & Operations
- **6 Maintenance Requests**: Various priorities from low to emergency
- **11 Messages**: Communication between tenants and property managers
- **11 Notifications**: System notifications for users

### 📋 Listings
- **6 Active Listings**: Available units ready for rental with detailed descriptions

## MongoDB Data Seeded

### 🤖 AI Content
- Knowledge base entries
- AI training data
- Analytics data

### 📊 Market Data
- Property market information
- Rental pricing data

## Test User Accounts

### Admin Account
- **Email**: admin@propertyai.com
- **Password**: Password123!
- **Role**: ADMIN

### Property Manager Accounts
- **Email**: sarah.manager@propertyai.com
- **Password**: Password123!
- **Role**: PROPERTY_MANAGER

- **Email**: michael.manager@propertyai.com  
- **Password**: Password123!
- **Role**: PROPERTY_MANAGER

### Tenant Accounts
- **Email**: john.tenant@example.com
- **Password**: Password123!
- **Role**: TENANT

- **Email**: emma.tenant@example.com
- **Password**: Password123!
- **Role**: TENANT

- **Email**: david.tenant@example.com
- **Password**: Password123!
- **Role**: TENANT

- **Email**: lisa.tenant@example.com
- **Password**: Password123!
- **Role**: TENANT

- **Email**: james.tenant@example.com
- **Password**: Password123!
- **Role**: TENANT

- **Email**: olivia.tenant@example.com
- **Password**: Password123!
- **Role**: TENANT

## Data Relationships

The seeded data maintains proper foreign key relationships:
- Users are assigned to appropriate roles
- Properties have managers and owners
- Units belong to properties and may have tenants
- Leases connect tenants to units
- Maintenance requests link tenants, units, and properties
- Messages are associated with maintenance requests
- Notifications are sent to appropriate users
- Listings showcase available units

## Schema Compliance

All seeded data has been verified to conform to the Prisma schema:
- ✅ Required fields are populated
- ✅ Data types match schema definitions
- ✅ Enum values are valid
- ✅ Foreign key relationships are maintained
- ✅ Unique constraints are respected
- ✅ Default values are properly set

## Usage

To reseed the database:
```bash
cd backend
npm run db:reset  # Resets and seeds
# OR
npm run db:seed   # Seeds only (without reset)
```

## Next Steps

The database is now ready for:
1. Frontend application testing
2. API endpoint testing
3. User authentication flows
4. Property management workflows
5. Maintenance request processing
6. Listing and application management

All test accounts use the password `Password123!` for easy testing.