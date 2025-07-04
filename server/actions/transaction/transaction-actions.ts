'use server';

import { db } from '@/lib/db';
import { Transaction, Prisma } from '@/lib/generated/prisma';
import { GoCardlessService } from '@/server/services/gocardless-service';
import { GoCardlessTransaction } from '@/types/gocardless-types';

const gocardlessService = new GoCardlessService();

export async function createTransactions(
    transactions: Prisma.TransactionCreateManyInput[],
) {
    return await db.transaction.createMany({
        data: transactions
    });
}

async function loadFreshTransactions(userId: string): Promise<Transaction[]> {
    const transactions = await gocardlessService.getTransactions(userId);

    // delete all transactions for the user
    await db.transaction.deleteMany({
        where: { userId },
    });

    const transactionsToCreate: Prisma.TransactionCreateManyInput[] = transactions.transactions.booked
        .filter((transaction: GoCardlessTransaction) => transaction.internalTransactionId)
        .map((transaction: GoCardlessTransaction) => ({
            userId,
            requisitionId: transaction.internalTransactionId!,
            entryReference: transaction.entryReference,
            internalTransactionId: transaction.internalTransactionId!,
            debtorName: transaction.debtorName,
            debtorAccountIban: transaction.debtorAccount?.iban,
            transactionAmount: transaction.transactionAmount.amount,
            transactionCurrency: transaction.transactionAmount.currency,
            bookingDate: new Date(transaction.bookingDate),
            valueDate: new Date(transaction.valueDate),
            remittanceInformationUnstructured: transaction.remittanceInformationUnstructured,
            bankTransactionCode: transaction.bankTransactionCode,
        }));

    // update transactions in db
    await db.transaction.createMany({
        data: transactionsToCreate,
    });

    // Return the created transactions
    return await db.transaction.findMany({
        where: { userId },
    });
}

export async function getTransactionsByUserId(userId: string, forceRefetch: boolean = false): Promise<Transaction[]> {
    if (forceRefetch) {
        return await loadFreshTransactions(userId);
    }

    // Find the transactions for the user
    const transactions = await db.transaction.findMany({
        where: { userId },
    });

    return transactions;
} 