import { useBillyAiStore } from '../store/billy-ai-store';
import { billyAiClient } from '../lib/billy-ai-client';
import z from 'zod';
import { SimplifiedTransactionSchema } from '@/schemas/simplified-transaction-schema';

export const useBillyAi = () => {
    const { matchingList, setMatchingList } = useBillyAiStore();

    const requestAiForImages = async (images: File[]) => {
        await billyAiClient.init();
        await billyAiClient.clearContext();
        const base64ImagesPromise = images.map(image => image.arrayBuffer());
        const base64Images = await Promise.all(base64ImagesPromise);
        const base64ImagesString = base64Images.map(base64Image => Buffer.from(base64Image).toString('base64'));
        const responses = [];
        for (let i = 0; i < base64ImagesString.length; i++) {
            const base64Image = base64ImagesString[i];
            const response = await billyAiClient.requestAiForStructuredResponse(
                "",
                [base64Image],
                z.null().or(SimplifiedTransactionSchema)
            );
            if (response) {
                responses.push({ ...response, base64Image });
            }
        }
        setMatchingList(responses);
        return responses;
    };

    return {
        matchingList,
        setMatchingList,
        requestAiForImages,
    };
}; 