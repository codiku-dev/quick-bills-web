import { billyAiClient } from '@/lib/billy-ai-client';
import { SimplifiedTransactionSchema } from '@/schemas/simplified-transaction-schema';
import { filesToBase64, fileToBase64 } from '@/lib/utils';
import { SimplifiedTransaction } from '@/types/simplified-transaction-types';
import { useMutation } from '@tanstack/react-query';

type MatchingTransactionWithImage = SimplifiedTransaction & { base64Image: string };

type MutationParams = {
    billsImages: File[];
    simplifiedTransactionsToCheck: SimplifiedTransaction[];
    onProgressPercentage?: (progress: number) => void;
};

export const useTransactionToImageMatching = () => {
    const getContextFromSimplifiedTransactionList = (simplifiedTransactionList: SimplifiedTransaction[]) => `
You are a billing image analyser API. 


As input here is an array of bills objects ( label, price and date of bill).

You will receive an image of billl.
Return the matching element from the array exactly as is.

Add an extra propertie in the object that is "detail" where you explain what made you chose this one

Try to find even partial information that could help you find the right item

There must be at least a partial match between the label and the image otherwise return null

DATA: 
${simplifiedTransactionList}
`;

    const generateMatchingTransactions = async (billsImages: File[], simplifiedTransactionsToCheck: SimplifiedTransaction[], onProgressPercentage?: (progress: number) => void): Promise<MatchingTransactionWithImage[]> => {
        const matchingTransactions = await Promise.all(billsImages.map(async (billsImage, i) => {
            const matchingTransaction = await generateMatchingTransaction(billsImage, simplifiedTransactionsToCheck);
            onProgressPercentage?.(i / billsImages.length * 100);
            return matchingTransaction;
        }));
        return matchingTransactions;
    };

    const generateMatchingTransaction = async (billsImage: File, simplifiedTransactionsToCheck: SimplifiedTransaction[]): Promise<MatchingTransactionWithImage> => {
        await billyAiClient.init();
        await billyAiClient.clearContext();
        const base64Image = await fileToBase64(billsImage);
        const response = await billyAiClient.requestAiForStructuredResponse(
            "",
            [base64Image],
            getContextFromSimplifiedTransactionList(simplifiedTransactionsToCheck),
            SimplifiedTransactionSchema
        );
        return { ...response, base64Image };
    }

    return useMutation({
        mutationFn: async ({ billsImages, simplifiedTransactionsToCheck, onProgressPercentage }: MutationParams) => {
            return await generateMatchingTransactions(billsImages, simplifiedTransactionsToCheck, onProgressPercentage);
        },
    });
};