import { UploadImagesInput, ImageFile, ImageOption } from '@/components/upload-images-input';
import { useMatchingTransactionsMutation, useTransactions } from '@/hooks/bank/use-transactions';
import { useGoCardlessStore } from '@/store/gocardless-store';
import { useState } from 'react';

export function AiUploadImages() {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const { requisitionId } = useGoCardlessStore();
  const { data: transactions = [], isLoading } = useTransactions(requisitionId);
  const { mutateAsync: generateMatchingTransactionsMutation, isPending: isMatchingTransactionsPending, data: matchingTransactions } = useMatchingTransactionsMutation();
  const onImagesSubmit = async (images: ImageFile[]) => {
    setProgressPercentage(0);
    await generateMatchingTransactionsMutation({
      billsImages: images.map(image => image.file),
      simplifiedTransactionsToCheck: transactions,
    });
    setProgressPercentage(100);

  };

  console.log('matchingTransactions', matchingTransactions);


  return (
    <UploadImagesInput
      isLoading={isMatchingTransactionsPending}
      maxFiles={100}

      progressPercentage={progressPercentage}
      onImagesSubmit={onImagesSubmit}
      imageOptions={Array.isArray(matchingTransactions) ? matchingTransactions.map(t => ({
        className: t.id ? "border-2 border-green-500 rounded-md" : "border-2 border-red-500 rounded-md",
        hoverMessage: `${t.id ? "✅" : "❌"} ${t.detail}`
      })) : []}
    />
  );
}
