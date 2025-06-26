'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGoCardlessStore } from '@/store/gocardless-store';
import { TransactionsManager } from '@/features/transaction-manager';

/* 
    This page is used to handle the callback from GoCardless after the user has connected their bank account.
   It just wait for the requisition ID to be in the URL query parameters and then redirect to the home page with the requisition ID.
*/
export default function GoCardlessCallbackPage() {
  const searchParams = useSearchParams();
  const { setRequisitionId, requisitionId } = useGoCardlessStore();

  useEffect(
    function extractRequisitionIdFromUrl() {
      // Extract requisition ID from URL parameters
      // GoCardless typically passes the requisition ID as a query parameter
      const ref = searchParams.get('ref');
      const requisition_id = searchParams.get('requisition_id');
      const id = searchParams.get('id');
      const idToUse = ref || requisition_id || id;

      if (idToUse) {
        setRequisitionId(idToUse);
      } else {
        console.log('⚠️ [CALLBACK] No requisition ID found in URL parameters');
        console.log('🔍 [CALLBACK] Available params:', Object.fromEntries(searchParams.entries()));
      }
    },
    [searchParams]
  );

  if (!requisitionId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Processing your bank connection...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we retrieve your account information</p>
          <p className="text-xs text-gray-400 mt-4">If this takes too long, please check your browser's console for any errors.</p>
        </div>
      </div>
    );
  }

  return <TransactionsManager />;
}
