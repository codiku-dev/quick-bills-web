'use server';

import { getTransactionDb } from '@/utils/db-utils';
import { GoCardlessService } from '@/server/services/gocardless-service';
import { GoCardlessTransaction } from '@/types/gocardless-types';

// Create a singleton instance for server actions
const client = new GoCardlessService();

export async function getTransactionsFromRequisition(requisitionId: string, forceRefresh: boolean = false) {
  try {
    // Always check cache first (unless force refresh is explicitly requested)
    const transactions = await getTransactionsByRequisitionId(requisitionId, 12); // 0.5 day cache (12 hours)
    if (transactions && !forceRefresh) {
      console.error('✅ [CACHE] Using cached transactions (API calls limited to 4/day)');
      return transactions;
    }

    // Only make API call if no cache exists OR force refresh is explicitly requested
    if (forceRefresh) {
      console.error('⚠️ [API] Force refresh requested. Making API call for transactions. Only 4 calls allowed per day!');
    } else {
      console.error('⚠️ [API] No cached data found. Making API call for transactions. Only 4 calls allowed per day!');
    }

    // First, let's check if the requisition exists and get its status
    const requisitionData = await client.getRequisition(requisitionId);

    if (!requisitionData.accounts || requisitionData.accounts.length === 0) {
      return [];
    }

    // We'll just use the first account for this example
    const accountId = requisitionData.accounts[0];
    console.log('🔄 [SERVER] Fetching transaction for account:', accountId);
    const transactionsData = await client.getTransactions(accountId);
    console.log('🔄 [SERVER] Transactions data:', transactionsData);

    const bookedTransactions = transactionsData?.transactions?.booked || [];

    // Save to cache for future use (7 day cache)
    await saveTransactions(requisitionId, bookedTransactions);
    console.error('💾 [CACHE] Transactions saved to cache for 7 days');

    return bookedTransactions;
  } catch (error: any) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
}

export async function getCachedTransactionsOnly(requisitionId: string) {
  try {
    console.log('🔄 [SERVER] Fetching cached transactions only (no API call)...');
    const transactions = await getTransactionsByRequisitionId(requisitionId);
    console.log('🔄 [SERVER] Found transactions (', transactions?.length, ')');
    if (transactions) {
      console.error('✅ [CACHE] Loading cached transactions only (no API call)');
      return transactions;
    } else {
      throw new Error('No cached transactions found');
    }
  } catch (error: any) {
    throw new Error(`No cached data available: ${error.message}`);
  }
}

export async function saveTransactions(requisitionId: string, transactions: GoCardlessTransaction[]) {
  const db = await getTransactionDb();
  await db.update(({ transactions: cache }) => {
    cache[requisitionId] = {
      data: transactions,
      timestamp: Date.now(),
      requisitionId,
    };
  });
}

export async function getTransactionsByRequisitionId(
  requisitionId: string,
  maxAgeHours: number = 12
): Promise<GoCardlessTransaction[] | null> {
  const db = await getTransactionDb();
  console.log('db', JSON.stringify(db.data));
  const cached = db.data.transactions[requisitionId];

  if (!cached) {
    console.error('❌ [CACHE] No cache found for requisition ID:', requisitionId);
    return null;
  }

  const ageHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
  console.error('🔍 [CACHE] Cache age:', Math.round(ageHours), 'hours');

  if (ageHours > maxAgeHours) {
    // Cache expired, but do NOT remove it unless a new value is being written
    console.error('⚠️ [CACHE] Using expired cached data (age:', Math.round(ageHours), 'hours). API calls limited to 4/day.');
  }

  console.error('✅ [CACHE] Found cached data with', cached.data.length, 'transactions');
  return cached.data || [];
}
