import { TransactionsManager } from '@/features/transaction-manager';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <TransactionsManager />
    </main>
  );
}
