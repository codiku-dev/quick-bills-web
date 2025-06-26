'use server';

import { billyAiClient } from '@/server/lib/billy-ai-client';
import { SimplifiedTransaction, SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';

export async function generateMatchingTransactions(
  billsImages: File[],
  simplifiedTransactionsToCheck: SimplifiedTransaction[]
): Promise<SimplifiedTransactionWithBillImage[]> {
  try {
    return await billyAiClient.generateMatchingTransactions(billsImages, simplifiedTransactionsToCheck);
  } catch (error: any) {
    throw new Error(`Failed to generate matching transactions: ${error.message}`);
  }
}

export async function generateMatchingTransaction(
  billsImage: File,
  simplifiedTransactionsToCheck: SimplifiedTransaction[]
): Promise<SimplifiedTransactionWithBillImage> {
  try {
    return await billyAiClient.generateMatchingTransaction(billsImage, simplifiedTransactionsToCheck);
  } catch (error: any) {
    throw new Error(`Failed to generate matching transaction: ${error.message}`);
  }
}
