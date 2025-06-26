import { SimplifiedTransactionsArraySchema, SimplifiedTransactionSchema } from "@/schemas/simplified-transaction-schema";
import { z } from "zod";
import { GoCardlessTransaction } from "@/types/gocardless-types";

export type SimplifiedTransaction = z.infer<typeof SimplifiedTransactionSchema>;
export type SimplifiedTransactionArray = z.infer<typeof SimplifiedTransactionsArraySchema>;
export type SimplifiedTransactionWithBillImage = SimplifiedTransaction & { base64Image?: string }

