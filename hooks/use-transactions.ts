import { useMutation, useQuery } from '@tanstack/react-query';
import { getTransactionsFromRequisition, getCachedTransactionsOnly } from '@/server/actions/gocardless/gocardless-actions';
import { generateMatchingTransactions } from '@/server/actions/billy-ai-actions';
import { simplifyTransactions } from '@/utils/format-data-utils';
import { SimplifiedTransaction, SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';
import { useEffect, useState } from 'react';

type MutationParams = {
  billsImages: File[];
  simplifiedTransactionsToCheck: SimplifiedTransaction[];
};

export const useTransactions = (requisitionId: string | null, forceRefresh: boolean = false) => {
  const [transactions, setTransactions] = useState<SimplifiedTransactionWithBillImage[]>([]);

  const { data: bankTransactions, ...rqueryRestProps } = useQuery({
    queryKey: ['transactions', requisitionId, forceRefresh],
    queryFn: async () => {
      console.log('Fetching transactions from server...');
      if (!requisitionId) {
        throw new Error('No requisition ID provided');
      }
      if (forceRefresh) {
        console.log('Force refreshing transactions...');
      } else {
        console.log('Fetching cached transactions...');
      }

      const transactions = forceRefresh
        ? await getTransactionsFromRequisition(requisitionId, true)
        : await getCachedTransactionsOnly(requisitionId);

      return transactions;
    },
    enabled: !!requisitionId,
  });

  const {
    mutate: generateMatchingTransactionsMutation,
    isPending: isMatchingTransactionsPending,
    data: matchingTransactions,
  } = useMutation({
    mutationFn: async ({ billsImages, simplifiedTransactionsToCheck }: MutationParams) => {
      return await generateMatchingTransactions(billsImages, simplifiedTransactionsToCheck);
    },
  });

  useEffect(() => {
    if (bankTransactions && bankTransactions.length > 0) {
      console.log('Setting transactions in memory');
      setTransactions(simplifyTransactions(bankTransactions));
    }
  }, [bankTransactions]);

  useEffect(
    function addImageToExistingTransactions() {
      if (matchingTransactions && matchingTransactions.length > 0) {
        console.log('Adding image to existing transactions in memory...');
        console.log('matchingTransactions', matchingTransactions);
        console.log('transactions', transactions);
        const updatedTransactions = transactions.map(
          transaction => matchingTransactions.find(matchingTransaction => matchingTransaction.id === transaction.id) || transaction
        );
        console.log('updatedTransactions', updatedTransactions);
        setTransactions(updatedTransactions);
      }
    },
    [matchingTransactions]
  );

  console.log('transactions in hook', transactions);

  return {
    transactions,
    setTransactions,
    generateMatchingTransactions: generateMatchingTransactionsMutation,
    isMatchingTransactionsPending,
    ...rqueryRestProps,
  };
};
