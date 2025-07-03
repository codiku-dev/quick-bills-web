'use server';

import { billyAiService } from '@/server/services/billy-ai-service';
import { SimplifiedTransaction, SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';

export async function generateMatchingTransactions(
  billsImages: File[],
  simplifiedTransactionsToCheck: SimplifiedTransaction[]
): Promise<SimplifiedTransactionWithBillImage[]> {
  try {
    const matchingTransactions = await billyAiService.generateMatchingTransactions(billsImages, simplifiedTransactionsToCheck);
    return matchingTransactions;
  } catch (error: any) {
    throw new Error(`Failed to generate matching transactions: ${error.message}`);
  }
}

export async function generateMatchingTransaction(
  billsImage: File,
  simplifiedTransactionsToCheck: SimplifiedTransaction[]
): Promise<SimplifiedTransactionWithBillImage> {
  try {
    return await billyAiService.generateMatchingTransaction(billsImage, simplifiedTransactionsToCheck);
  } catch (error: any) {
    throw new Error(`Failed to generate matching transaction: ${error.message}`);
  }
}
