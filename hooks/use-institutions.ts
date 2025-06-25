import { useQuery } from '@tanstack/react-query';
import { getInstitutions } from '@/actions/gocardless/gocardless-actions';

export const useInstitutions = (country: string = 'FR') => {
    return useQuery({
        queryKey: ['institutions', country],
        queryFn: async () => {
            const data = await getInstitutions(country);
            return data;
        },
    });
}; 