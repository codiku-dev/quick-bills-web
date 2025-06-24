'use server';

import { saveTransactions, getCachedTransactions, getTransactionDb } from '@/utils/db-utils';
import { GoCardlessClient } from '../../lib/gocardless-client';

// Create a singleton instance for server actions
const client = new GoCardlessClient();

export async function getTransactionsFromRequisition(requisitionId: string, forceRefresh: boolean = false) {
    try {
        // Always check cache first (unless force refresh is explicitly requested)
        const cachedTransactions = await getCachedTransactions(requisitionId, 168); // 7 day cache (168 hours)
        if (cachedTransactions && !forceRefresh) {
            console.error('✅ [CACHE] Using cached transactions (API calls limited to 4/day)');
            return { transactions: cachedTransactions };
        }

        // Only make API call if no cache exists OR force refresh is explicitly requested
        if (forceRefresh) {
            console.error('⚠️ [API] Force refresh requested. Making API call for transactions. Only 4 calls allowed per day!');
        } else {
            console.error('⚠️ [API] No cached data found. Making API call for transactions. Only 4 calls allowed per day!');
        }

        // First, let's check if the requisition exists and get its status
        console.log('🔄 [SERVER] Fetching requisition data for ID:', requisitionId);
        const requisitionData = await client.getRequisition(requisitionId);
        console.log('🔄 [SERVER] Requisition data:', requisitionData);

        if (!requisitionData.accounts || requisitionData.accounts.length === 0) {
            return { transactions: [], account: null, balances: null };
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

        return {
            transactions: bookedTransactions,
        };
    } catch (error: any) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
}

export async function getCachedTransactionsOnly(requisitionId: string) {
    try {
        const cachedTransactions = await getCachedTransactions(requisitionId, 168);
        if (cachedTransactions) {
            console.error('✅ [CACHE] Loading cached transactions only (no API call)');
            return { transactions: cachedTransactions };
        } else {
            throw new Error('No cached transactions found');
        }
    } catch (error: any) {
        throw new Error(`No cached data available: ${error.message}`);
    }
}

export async function debugCache() {
    try {
        const db = await getTransactionDb();
        const allData = db.data.transactions;

        const cacheInfo: Record<string, { transactionCount: number; ageHours: number; timestamp: number }> = {};
        Object.keys(allData).forEach(key => {
            const data = allData[key];
            const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
            console.log(`  - ${key}: ${data.data.length} transactions (age: ${Math.round(ageHours)}h)`);
            cacheInfo[key] = {
                transactionCount: data.data.length,
                ageHours: Math.round(ageHours),
                timestamp: data.timestamp
            };
        });

        return { success: true, cacheInfo, keys: Object.keys(allData) };
    } catch (error: any) {
        console.error('❌ [CACHE] Error debugging cache:', error.message);
        return { success: false, error: error.message };
    }
} 