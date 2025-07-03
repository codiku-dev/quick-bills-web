import { JSONFilePreset } from "lowdb/node";
import { mkdirSync, existsSync, readFileSync } from "fs";
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

        const filePath = join(process.cwd(), 'data/requisition-mapping.json');

        // Check if file exists, if not throw error
        if (!existsSync(filePath)) {
            throw new Error(`Requisition mapping file not found: ${filePath}`);
        }

        const defaultData: RequisitionMapping = { mappings: {} };
        requisitionDb = await JSONFilePreset('assets/data/requisition-mapping.json', defaultData);
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

        const filePath = join(process.cwd(), 'assets/data/transaction-cache.json');

        // Check if file exists, if not throw error
        if (!existsSync(filePath)) {
            throw new Error(`Transaction cache file not found: ${filePath}`);
        }

        const defaultData: TransactionCache = { transactions: {} };
        transactionDb = await JSONFilePreset('assets/data/transaction-cache.json', defaultData);
    }
    return transactionDb;
}







