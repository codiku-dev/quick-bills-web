import { DraggableImagesZone, ImageFile } from '@/components/DraggableImagesZone';
import { useMatchingTransactionsMutation, useTransactions } from '@/hooks/use-transactions';
import { useGoCardlessStore } from '@/store/gocardless-store';
import { useState } from 'react';

export function AiUploadImages() {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const { requisitionId } = useGoCardlessStore();
  const { data: transactions = [], isLoading } = useTransactions(requisitionId);
  const { mutate: generateMatchingTransactionsMutation, isPending: isMatchingTransactionsPending } = useMatchingTransactionsMutation();
  const onImagesSubmit = (images: ImageFile[]) => {
    setProgressPercentage(0);
    generateMatchingTransactionsMutation({
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
