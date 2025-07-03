import { useGoCardlessStore } from '@/store/gocardless-store';
import { useTransactions } from '@/hooks/bank/use-transactions';
import { useQueryClient } from '@tanstack/react-query';

export function TransactionMenuLoader() {
  const { requisitionId, setRequisitionId } = useGoCardlessStore();
  const queryClient = useQueryClient();
  const { isLoading: transactionsLoading } = useTransactions(requisitionId);

  if (!requisitionId) {
    return null;
  }

  const handleLoadCached = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', requisitionId, false] });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', requisitionId, true] });
  };

  const handleClearConnection = () => {
    setRequisitionId(null);
    queryClient.removeQueries({ queryKey: ['transactions', requisitionId] });
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-medium mb-2 text-blue-800">Stored Bank Connection</h3>
      <div className="text-sm text-blue-600 mb-3">
        <p className="mb-2">You have a stored bank connection. Transactions are cached for 7 days to minimize API calls.</p>
        <p className="text-red-600 font-semibold">⚠️ WARNING: Only 4 API calls allowed per day! Use cached data when possible.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleLoadCached}
          disabled={transactionsLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {transactionsLoading ? 'Loading...' : 'Load Cached Data (Free)'}
        </button>
        <button
          onClick={handleRefresh}
          disabled={transactionsLoading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          {transactionsLoading ? 'Refreshing...' : 'Refresh from Bank (Uses 1/4 Daily Calls)'}
        </button>
        <button onClick={handleClearConnection} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">
          Clear Connection
        </button>
      </div>
    </div>
  );
}
