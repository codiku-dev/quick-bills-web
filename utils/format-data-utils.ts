import { SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';
import { GoCardlessTransaction } from '@/types/gocardless-types';

export const simplifyTransactions = (transactions: GoCardlessTransaction[]): SimplifiedTransactionWithBillImage[] => {
  const simplifiedTransactions = transactions.map(transaction => ({
    id: transaction.internalTransactionId!,
    label: transaction.remittanceInformationUnstructuredArray?.join(' ') || '',
    price: transaction.transactionAmount.amount,
    date: transaction.bookingDate,
    detail: transaction.remittanceInformationUnstructuredArray?.join(' ') || '',
    base64Image: undefined,
  }));
  return simplifiedTransactions;
};
