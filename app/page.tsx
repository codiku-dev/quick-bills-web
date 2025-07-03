import { TransactionsManager } from '@/features/transactions/transaction-manager';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <TransactionsManager />
    </main>
  );
}
