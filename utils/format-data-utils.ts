import { SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';
import { GoCardlessTransaction } from '@/types/gocardless-types';
import { Transaction } from '@/lib/generated/prisma';

export const simplifyTransactions = (transactions: Transaction[]): SimplifiedTransactionWithBillImage[] => {
  const simplifiedTransactions = transactions.map(transaction => ({
    id: transaction.internalTransactionId!,
    label: transaction.remittanceInformationUnstructured || '',
    price: transaction.transactionAmount,
    date: transaction.bookingDate.toISOString(),
    detail: transaction.remittanceInformationUnstructured || '',
    base64Image: undefined,
  }));
  return simplifiedTransactions;
};
