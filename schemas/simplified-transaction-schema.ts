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