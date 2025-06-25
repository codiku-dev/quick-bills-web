import { DraggableImagesZone, ImageFile } from "@/components/DraggableImagesZone";
import { useTransactionToImageMatching } from "@/hooks/use-transaction-to-image-matching";
import { useTransactions } from "@/hooks/use-transactions";
import { useGoCardlessStore } from "@/store/gocardless-store";
import { simplifyTransactions } from "@/utils/format-data-utils";
import { useState } from "react";

export function AiUploadImages() {
    const [progressPercentage, setProgressPercentage] = useState(0);
    const { mutate: generateMatchingTransactions, isPending: isMatchingTransactionsPending } = useTransactionToImageMatching();
    const { requisitionId } = useGoCardlessStore();
    const { data: transactions } = useTransactions(requisitionId, false);
    const simplifiedTransactions = simplifyTransactions(transactions || [])

    const onImagesSubmit = (images: ImageFile[]) => {
        setProgressPercentage(0);
        generateMatchingTransactions(
            {
                billsImages: images.map(image => image.file),
                simplifiedTransactionsToCheck: simplifiedTransactions,
                onProgressPercentage: (progressPercentage) => setProgressPercentage(progressPercentage)
            }
        );
    }

    return <DraggableImagesZone isLoading={isMatchingTransactionsPending} maxFiles={100} progressPercentage={progressPercentage} onImagesSubmit={onImagesSubmit} />
}