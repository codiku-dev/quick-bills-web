import { JSONFilePreset } from "lowdb/node";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { RequisitionMapping, TransactionCache, RequisitionDb, TransactionDb } from "@/types/db-types";

let requisitionDb: RequisitionDb;
let transactionDb: TransactionDb;

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







