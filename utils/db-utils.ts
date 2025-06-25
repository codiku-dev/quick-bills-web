import { JSONFilePreset } from "lowdb/node";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { SimplifiedTransaction } from "@/types/simplified-transaction-types";
import { GoCardlessTransaction } from "@/types/gocardless-types";

// Reference ID to Requisition ID mapping using lowdb
type RequisitionMapping = {
    mappings: Record<string, string>;
};

// Transaction storage with cache invalidation
type TransactionCache = {
    transactions: Record<string, {
        data: any[];
        timestamp: number;
        requisitionId: string;
    }>;
};

let requisitionDb: Awaited<ReturnType<typeof JSONFilePreset<RequisitionMapping>>>;
let transactionDb: Awaited<ReturnType<typeof JSONFilePreset<TransactionCache>>>;

export async function getRequisitionDb() {
    if (!requisitionDb) {
        // Ensure data directory exists
        const dataDir = join(process.cwd(), 'data');
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }

        const defaultData: RequisitionMapping = { mappings: {} };
        requisitionDb = await JSONFilePreset('data/requisition-mapping.json', defaultData);
    }
    return requisitionDb;
}

export async function getTransactionDb() {
    if (!transactionDb) {
        // Ensure data directory exists
        const dataDir = join(process.cwd(), 'data');
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }

        const defaultData: TransactionCache = { transactions: {} };
        transactionDb = await JSONFilePreset('data/transaction-cache.json', defaultData);
    }
    return transactionDb;
}

export async function getRequisitionIdFromMapping(referenceId: string): Promise<string | null> {
    const db = await getRequisitionDb();
    return db.data.mappings[referenceId] || null;
}

export async function saveTransactions(requisitionId: string, transactions: GoCardlessTransaction[]) {
    const db = await getTransactionDb();
    await db.update(({ transactions: cache }) => {
        cache[requisitionId] = {
            data: transactions,
            timestamp: Date.now(),
            requisitionId
        };
    });
}

export async function getCachedTransactions(requisitionId: string, maxAgeHours: number = 12): Promise<GoCardlessTransaction[] | null> {
    const db = await getTransactionDb();
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
    return cached.data;
}

export async function clearTransactionCache(requisitionId?: string) {
    const db = await getTransactionDb();
    if (requisitionId) {
        await db.update(({ transactions }) => {
            delete transactions[requisitionId];
        });
    } else {
        await db.update(({ transactions }) => {
            Object.keys(transactions).forEach(key => delete transactions[key]);
        });
    }
}

export async function listAllCachedData() {
    const db = await getTransactionDb();
    const allData = db.data.transactions;

    console.error('📋 [CACHE] All cached data:');
    Object.keys(allData).forEach(key => {
        const data = allData[key];
        const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
        console.error(`  - ${key}: ${data.data.length} transactions (age: ${Math.round(ageHours)}h)`);
    });

    return allData;
}

