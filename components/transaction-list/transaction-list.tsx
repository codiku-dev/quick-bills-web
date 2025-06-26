import { SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';
import { GoCardlessTransaction } from '@/types/gocardless-types';
import { TransactionListItem } from './transaction-list-item';

export function TransactionList(p: { transactions: SimplifiedTransactionWithBillImage[] }) {
  return p.transactions.map(transaction => {
    return <TransactionListItem key={transaction.id} item={transaction} />;
  });
}
