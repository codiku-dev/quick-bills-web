import { DraggableImagesZone, ImageFile } from '@/components/DraggableImagesZone';
import { useTransactions } from '@/hooks/use-transactions';
import { useGoCardlessStore } from '@/store/gocardless-store';
import { useState } from 'react';

export function AiUploadImages() {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const { requisitionId } = useGoCardlessStore();
  const { transactions, generateMatchingTransactions, isMatchingTransactionsPending } = useTransactions(requisitionId, false);

  const onImagesSubmit = (images: ImageFile[]) => {
    setProgressPercentage(0);
    generateMatchingTransactions({
      billsImages: images.map(image => image.file),
      simplifiedTransactionsToCheck: transactions,
    });
  };

  return (
    <DraggableImagesZone
      isLoading={isMatchingTransactionsPending}
      maxFiles={100}
      progressPercentage={progressPercentage}
      onImagesSubmit={onImagesSubmit}
    />
  );
}
