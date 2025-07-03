import { z } from "zod";

// Define the Bill schema using Zod
export const SimplifiedTransactionSchema = z.object({
    id: z.string().or(z.null()),
    label: z.string().or(z.null()),
    price: z.string().or(z.null()),
    date: z.string().or(z.null()),
    detail: z.string()
})

// Define the Bills array schema
export const SimplifiedTransactionsArraySchema = z.array(SimplifiedTransactionSchema);