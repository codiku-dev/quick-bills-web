# my-app

## What do I get by default ?

Nothing fancy. Just a default next.js project with tailwind and typescript.

Two things are added :
- *types/env-types.ts* that provides type safety for the process.env variables.
- a *not-found.tsx* page for you to customize.

## Getting Started

First, install the dependencies:

```bash
bun i
```

Then, run the development server:

```bash
bun dev

Run the lms ai backend

```bash
npx lmstudio install-cli
lms get google/gemma3-12b
lms load google/gemma3-12b
lms start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.





# GoCardless Actions

This directory contains the refactored GoCardless integration, organized into separate modules for better maintainability and reusability.

## Structure

```
gocardless/
├── auth.ts          # Authentication and connection management
├── requisitions.ts  # Institution and requisition management
├── transactions.ts  # Transaction fetching and caching
├── index.ts         # Re-exports all functions for backward compatibility
└── README.md        # This file
```

## Architecture

### GoCardlessService Class (`/lib/gocardless-client.ts`)

A pure client class that handles all GoCardless API interactions:

- **Token Management**: Automatic token refresh and caching (internal)
- **Rate Limiting**: Built-in rate limit handling and delays (internal)
- **Error Handling**: Consistent error handling across all endpoints
- **Type Safety**: Full TypeScript support with proper types
- **Clean API**: Only high-level business methods are exposed

### Module Separation

1. **Auth Module** (`auth.ts`): Connection testing, rate limit checking
2. **Requisitions Module** (`requisitions.ts`): Institution listing, session initialization
3. **Transactions Module** (`transactions.ts`): Transaction fetching with caching

## Usage

### Using the Client Directly

```typescript
import { GoCardlessService } from '@/lib/gocardless-client';

const client = new GoCardlessService();

// Get institutions
const institutions = await client.getInstitutions('fr');

// Create a requisition
const requisition = await client.createRequisition(
    institutionId, 
    referenceId, 
    redirectUrl, 
    agreementId
);

// Get transactions
const transactions = await client.getTransactions(accountId);

// Test connection
const connectionStatus = await client.testConnection();

// Check rate limits
const rateLimitStatus = await client.checkRateLimit();
```

### Using Server Actions (Backward Compatible)

```typescript
import { 
    getInstitutions, 
    initializeSession, 
    getTransactionsFromRequisition,
    testGoCardlessConnection,
    checkRateLimitStatus
} from '@/actions/gocardless';

// These work exactly as before
const institutions = await getInstitutions('fr');
const session = await initializeSession(institutionId);
const transactions = await getTransactionsFromRequisition(requisitionId);
```

## Public API

The `GoCardlessService` exposes only the following high-level methods:

### Institution Methods
- `getInstitutions(country: string)`: Get available institutions for a country

### Agreement Methods
- `createEndUserAgreement(institutionId: string)`: Create an end user agreement
- `getAgreementById(agreementId: string)`: Get agreement details

### Requisition Methods
- `createRequisition(institutionId, referenceId, redirectUrl, agreementId?)`: Create a requisition
- `getRequisition(requisitionId: string)`: Get requisition details

### Transaction Methods
- `getTransactions(accountId: string)`: Get transactions for an account

### Utility Methods
- `testConnection()`: Test the API connection
- `checkRateLimit(requisitionId?)`: Check current rate limit status

## Benefits

1. **Clean API**: Only business-level methods are exposed, internal implementation details are hidden
2. **Reusability**: The `GoCardlessService` can be used in any context (server actions, API routes, etc.)
3. **Maintainability**: Each module has a single responsibility
4. **Testability**: Pure functions and classes are easier to test
5. **Type Safety**: Full TypeScript support throughout
6. **Backward Compatibility**: Existing code continues to work without changes

## Migration

The refactoring maintains full backward compatibility. Existing imports and function calls will continue to work without any changes needed. 