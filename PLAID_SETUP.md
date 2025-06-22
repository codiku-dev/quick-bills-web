# Plaid Integration Setup

## 1. Get Plaid Credentials

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Create an account or sign in
3. Go to the "Keys" section
4. Copy your `Client ID` and `Sandbox Secret`

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_sandbox_secret_here
```

## 3. Test the Integration

1. Run your development server: `bun dev`
2. Open http://localhost:3000
3. Click "Connect Bank Account"
4. Use Plaid's sandbox credentials:
   - Username: `user_good`
   - Password: `pass_good`

## 4. Features

- ✅ Connect to bank accounts via Plaid Link
- ✅ Retrieve transactions for the last 30 days
- ✅ Display transaction details (amount, date, merchant, category)
- ✅ Simple, clean UI
- ✅ Uses Next.js server functions (no API routes needed)

## 5. Architecture

- **Server Functions**: `app/lib/plaid.ts` contains server actions for Plaid operations
- **Client Component**: `app/components/PlaidLink.tsx` handles the UI and calls server functions
- **No API Routes**: Uses Next.js server functions for better performance and type safety

## 6. Next Steps

To make this production-ready:
1. Add proper error handling
2. Implement the actual Plaid Link SDK
3. Add user authentication
4. Store access tokens securely
5. Add transaction filtering and search
6. Implement webhook handling for real-time updates 