import { z } from "zod";

// Define the Bill schema using Zod
export const SimplifiedTransactionSchema = z.object({
    id: z.string(),
    label: z.string(),
    price: z.string(),
    date: z.string(),
    detail: z.string()
})

// Define the Bills array schema
export const SimplifiedTransactionsArraySchema = z.array(SimplifiedTransactionSchema);

export type SimplifiedTransaction = z.infer<typeof SimplifiedTransactionSchema>;
export type SimplifiedTransactionArray = z.infer<typeof SimplifiedTransactionsArraySchema>;