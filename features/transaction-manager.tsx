'use client';

import { useGoCardlessStore } from '@/store/gocardless-store';
import { useInstitutions } from '@/hooks/use-institutions';
import { useTransactions } from '@/hooks/use-transactions';
import { MenuDataLoader } from '@/features/menu-data-loader';
import { FormBankCountry } from '@/components/FormBankCountry';
import { FormSelectBank } from '@/components/FormSelectBank';
import { SpinnerBankLoading } from '@/features/spinner-bank-loading';
import { TransactionList } from '@/components/transaction-list/transaction-list';
import { AiUploadImages } from '@/features/ai-upload-images/ai-upload-images';
import { useEffect } from 'react';

export function TransactionsManager() {
  const { requisitionId, step, setStep } = useGoCardlessStore();
  const { isLoading: institutionsLoading } = useInstitutions();
  const { transactions = [], isLoading: transactionsLoading } = useTransactions(requisitionId);
  useEffect(() => {
    if (transactions.length > 0) {
      setStep('transactions');
    }
  }, [transactions]);
  const renderTransactions = () => {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-3 max-h-[1000px] overflow-y-auto">
          <TransactionList transactions={transactions} />
        </div>
      </div>
    );
  };
  if (institutionsLoading || transactionsLoading) {
    return <SpinnerBankLoading />;
  }
  return (
    <div className="p-6">
      <div className="flex flex-row gap-6">
        <div className="flex-1/7">
          {/* AI/Draggable zone moved elsewhere */}
          <AiUploadImages />
        </div>
        <div className="flex-4/5">
          <h1 className="text-3xl font-bold mb-6">Bank Connection (GoCardless)</h1>
          <MenuDataLoader />
          {step === 'select-country' && <FormBankCountry />}
          {step === 'select-bank' && <FormSelectBank />}
          {step === 'transactions' && transactions.length > 0 && renderTransactions()}
        </div>
      </div>
    </div>
  );
}
