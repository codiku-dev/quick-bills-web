'use client';

import { useGoCardlessStore } from '@/store/gocardless-store';
import { useInstitutions } from '@/hooks/bank/use-institutions';
import { useMatchingTransactionsData, useTransactions } from '@/hooks/bank/use-transactions';
import { SpinnerBankLoading } from '@/features/auth-bank/components/spinner-bank-loading';
import { TransactionList } from '@/components/transaction-list/transaction-list';
import { AiUploadImages } from '@/features/ai-upload-images/ai-upload-images';
import { useEffect, useState } from 'react';
import { SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';

export function TransactionsManager() {
  const { requisitionId, step, setStep } = useGoCardlessStore();
  const { isLoading: institutionsLoading } = useInstitutions();
  const { data: transactions = [] } = useTransactions(requisitionId);
  const matchingTransactions = useMatchingTransactionsData();
  const [transactionWithImages, setTransactionWithImages] = useState<SimplifiedTransactionWithBillImage[]>([]);

  useEffect(() => {
    if (transactions.length > 0) {
      setTransactionWithImages(transactions);
    }
  }, [transactions]);

  useEffect(
    function injectBillImagesIntoMatchedTransactions() {
      if (matchingTransactions.length > 0) {
        const updatedTransactions = transactions.map(transaction => {
          const matchingTransaction = matchingTransactions.find(matching => matching.id === transaction.id);
          if (matchingTransaction) {
            console.log(`Found match for transaction ${transaction.id}, adding image`);
            return {
              ...transaction,
              base64Image: matchingTransaction.base64Image,
            };
          }
          return transaction;
        });

        console.log('Updated transactions with images:', updatedTransactions.filter(t => t.base64Image).length);
        setTransactionWithImages(updatedTransactions);
      }
    },
    [matchingTransactions, transactions]
  );

  const renderTransactions = () => {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-3 max-h-[1000px] overflow-y-auto">
          <TransactionList transactions={transactionWithImages} />
        </div>
      </div>
    );
  };

  if (institutionsLoading) {
    return <SpinnerBankLoading />;
  }
  console.log('transactions', transactions);


  return (
    <div className="p-6">
      <div className="flex flex-row gap-6">
        <div className="flex-1/7">
          {/* AI/Draggable zone moved elsewhere */}
          <AiUploadImages />
        </div>
        <div className="flex-4/5">
          <h1 className="text-3xl font-bold mb-6">Bank Connection (GoCardless)</h1>
          {/* <MenuDataLoader />
          {step === 'select-country' && <FormBankCountry />}
          {step === 'select-bank' && <FormSelectBank />} */}
          {transactions.length > 0 && renderTransactions()}
        </div>
      </div>
    </div>
  );
}
