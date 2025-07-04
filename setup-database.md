# Database Setup Guide

This guide will help you migrate from file-based storage to PostgreSQL with Prisma.

## Prerequisites

1. **Docker** - Make sure Docker is installed and running
2. **Node.js/Bun** - For running Prisma commands

## Step 1: Start PostgreSQL Database

```bash
# Start the PostgreSQL container
docker compose up -d

# Verify it's running
docker compose ps
```

## Step 2: Set Environment Variables

Create or update your `.env` file with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quickbills"
```

## Step 3: Generate Prisma Client

```bash
# Generate the Prisma client
bun run db:generate
```

## Step 4: Run Database Migrations

```bash
# Create and apply the initial migration
bun run db:migrate
```

## Step 5: Verify Setup

```bash
# Open Prisma Studio to view your database
bun run db:studio
```

## Database Schema

The new schema includes:

### User Table
- `id` - Unique identifier (CUID)
- `requisitionId` - GoCardless requisition ID (unique)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Transaction Table
- `id` - Unique identifier (CUID)
- `userId` - Foreign key to User
- `transactions` - JSON array of GoCardless transactions
- `timestamp` - Cache timestamp
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## Migration Notes

### What Changed

1. **File Storage → Database**: Replaced lowdb JSON files with PostgreSQL tables
2. **Simplified Schema**: 
   - `RequisitionMapping` → `User` table
   - `TransactionCache` → `Transaction` table
3. **Better Relationships**: Transactions are now properly linked to Users
4. **Improved Performance**: Database queries instead of file I/O

### API Compatibility

The new database utilities maintain the same API as the old file-based storage:

- `cacheTransactions(requisitionId, transactions, timestamp)`
- `getCachedTransactions(requisitionId)`
- `createUser(requisitionId)`
- `getUserByRequisitionId(requisitionId)`

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps

# View logs
docker compose logs postgres

# Restart the container
docker compose restart postgres
```

### Prisma Issues

```bash
# Reset the database
docker compose down -v
docker compose up -d
bun run db:migrate

# Regenerate client
bun run db:generate
```

### Data Migration

If you have existing data in the JSON files, you can migrate it:

1. Export data from old JSON files
2. Use Prisma Studio or create a migration script
3. Import data into the new database schema

## Next Steps

1. Test your application with the new database
2. Remove the old `utils/db-utils.ts` file once everything works
3. Consider adding database indexes for better performance
4. Set up database backups for production 