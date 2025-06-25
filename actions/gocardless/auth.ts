'use server';

import { GoCardlessClient } from '@/lib/gocardless-client';
import { getRequisitionDb } from '@/utils/db-utils';

// Create a singleton instance for server actions
const gocardlessClient = new GoCardlessClient();

export async function testGoCardlessConnection() {
    return gocardlessClient.testConnection();
}

export async function checkRateLimitStatus() {
    try {
        // First try to get a real requisition ID from our stored mappings
        const db = await getRequisitionDb();
        const storedRequisitionIds = Object.values(db.data.mappings);

        if (storedRequisitionIds.length > 0) {
            // Test with a real requisition ID to check transaction endpoint rate limits
            const testRequisitionId = storedRequisitionIds[0];
            return gocardlessClient.checkRateLimit(testRequisitionId);
        } else {
            // No stored requisitions, test with institutions endpoint
            return gocardlessClient.checkRateLimit();
        }
    } catch (error: any) {
        console.error('❌ [SERVER] Error checking rate limit status:', error.message);
        return { rateLimited: true, error: error.message };
    }
} 