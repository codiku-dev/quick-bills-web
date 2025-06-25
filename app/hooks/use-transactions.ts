import { useQuery } from '@tanstack/react-query';
import { getTransactionsFromRequisition, getCachedTransactionsOnly } from '@/app/actions/gocardless-actions';

export const useTransactions = (requisitionId: string | null, forceRefresh: boolean = false) => {
    return useQuery({
        queryKey: ['transactions', requisitionId, forceRefresh],
        queryFn: async () => {
            if (!requisitionId) {
                throw new Error('No requisition ID provided');
            }

            const data = forceRefresh
                ? await getTransactionsFromRequisition(requisitionId, true)
                : await getCachedTransactionsOnly(requisitionId);

            return data.transactions;
        },
        enabled: !!requisitionId,
    });
}; 