import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTransactionsFromRequisition, getCachedTransactionsOnly } from '@/server/actions/gocardless/gocardless-actions';
import { generateMatchingTransactions } from '@/server/actions/billy-ai-actions';
import { simplifyTransactions } from '@/utils/format-data-utils';
import { SimplifiedTransaction, SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';
import { useEffect, useState, useCallback, useMemo } from 'react';

type MutationParams = {
  billsImages: File[];
  simplifiedTransactionsToCheck: SimplifiedTransaction[];
};

export const useMatchingTransactionsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['matching-transactions'],
    mutationFn: async ({ billsImages, simplifiedTransactionsToCheck }: MutationParams) => {
      console.log('Generating matching transactions...');
      return await generateMatchingTransactions(billsImages, simplifiedTransactionsToCheck);
    },
  });
};

// Hook to reactively access the matching transactions data from anywhere
export const useMatchingTransactionsData = () => {
  const data = useMutationState({
    filters: { mutationKey: ['matching-transactions'] },
    select: mutation => mutation.state.data,
  });

  console.log(' la data', data);
  return data.length > 0 && data[data.length - 1] ? (data[data.length - 1] as SimplifiedTransactionWithBillImage[]) : [];
};

export const useTransactions = (requisitionId: string | null, forceRefresh: boolean = false) => {
  // const [transactions, setTransactions] = useState<SimplifiedTransactionWithBillImage[]>([]);
  // const queryClient = useQueryClient();

  return useQuery({
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

      const simplifiedTransactions = simplifyTransactions(transactions);
      return simplifiedTransactions;
    },
    enabled: !!requisitionId,
  });

  // const {
  //   mutate: generateMatchingTransactionsMutation,
  //   isPending: isMatchingTransactionsPending,
  //   data: matchingTransactions,
  // } = useMutation({
  //   mutationFn: async ({ billsImages, simplifiedTransactionsToCheck }: MutationParams) => {
  //     console.log('Generating matching transactions...');
  //     return await generateMatchingTransactions(billsImages, simplifiedTransactionsToCheck);
  //   },
  //   onSuccess: data => {
  //     console.log('Mutation succeeded, invalidating query cache');
  //     queryClient.invalidateQueries({ queryKey: ['transactions', requisitionId, forceRefresh] });
  //   },
  // });

  // // Update transactions when bank transactions change
  // useEffect(() => {
  //   if (bankTransactions && bankTransactions.length > 0) {
  //     console.log('Setting transactions in memory');
  //     const simplified = simplifyTransactions(bankTransactions);
  //     console.log('Simplified transactions:', simplified);
  //     setTransactions(simplified);
  //   }
  // }, [bankTransactions]);

  // // Update transactions when matching transactions are available
  // useEffect(() => {
  //   if (matchingTransactions && matchingTransactions.length > 0) {
  //     console.log('Adding image to existing transactions in memory...');
  //     console.log('matchingTransactions', matchingTransactions);

  //     setTransactions(currentTransactions => {
  //       console.log('currentTransactions', currentTransactions);
  //       const updatedTransactions = currentTransactions.map(transaction => {
  //         const matchingTransaction = matchingTransactions.find(matchingTransaction => matchingTransaction.id === transaction.id);
  //         return matchingTransaction || transaction;
  //       });
  //       console.log('updatedTransactions', updatedTransactions);

  //       return updatedTransactions;
  //     });
  //   }
  // }, [matchingTransactions]);
};
