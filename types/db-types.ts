import { JSONFilePreset } from "lowdb/node";
import { GoCardlessTransaction } from "@/types/gocardless-types";

// Reference ID to Requisition ID mapping using lowdb
type RequisitionMapping = {
    mappings: Record<string, string>;
};

// Transaction storage with cache invalidation
type TransactionCache = {
    transactions: Record<string, {
        data: GoCardlessTransaction[];
        timestamp: number;
        requisitionId: string;
    }>;
};

type RequisitionDb = Awaited<ReturnType<typeof JSONFilePreset<RequisitionMapping>>>;
type TransactionDb = Awaited<ReturnType<typeof JSONFilePreset<TransactionCache>>>;

export type { RequisitionMapping, TransactionCache, RequisitionDb, TransactionDb };
