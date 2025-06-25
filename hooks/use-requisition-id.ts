import { useQuery } from '@tanstack/react-query';
import { getRequisitionIdFromReference } from '@/actions/gocardless/gocardless-actions';
import { useGoCardlessStore } from '@/store/gocardless-store';

export const useRequisitionId = (referenceId: string | null) => {
    const { setRequisitionId } = useGoCardlessStore();

    return useQuery({
        queryKey: ['requisitionId', referenceId],
        queryFn: async () => {
            if (!referenceId) {
                throw new Error('No reference ID provided');
            }

            const requisitionId = await getRequisitionIdFromReference(referenceId);
            if (requisitionId) {
                setRequisitionId(requisitionId);
            }
            return requisitionId;
        },
        enabled: !!referenceId,
    });
}; 