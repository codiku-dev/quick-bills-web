import { useMutationState } from '@tanstack/react-query';

// Hook to reactively access the matching transactions data from anywhere
export const useMutationLastData = <T>(mutationKey: string) => {
  const data = useMutationState({
    filters: { mutationKey: [mutationKey] },
    select: mutation => mutation.state.data,
  });

  return { data: data.length > 0 ? (data[data.length - 1] as T) : undefined };
};
