import { useMutation } from '@tanstack/react-query';
import { useBillyAi } from './use-billy-ai';

export const useBillyAiMutation = () => {
    const { requestAiForImages } = useBillyAi();

    return useMutation({
        mutationFn: async (images: File[]) => {
            return await requestAiForImages(images);
        },
    });
}; 