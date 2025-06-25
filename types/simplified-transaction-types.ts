import { SimplifiedTransactionsArraySchema, SimplifiedTransactionSchema } from "@/schemas/simplified-transaction-schema";
import { z } from "zod";

export type SimplifiedTransaction = z.infer<typeof SimplifiedTransactionSchema>;
export type SimplifiedTransactionArray = z.infer<typeof SimplifiedTransactionsArraySchema>;